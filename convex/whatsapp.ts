"use node";

/**
 * WhatsApp Webhook Handler
 *
 * Receives incoming WhatsApp messages from Kapso (later: Meta Cloud API),
 * authenticates the doctor via phone link, checks quotas, rate limits,
 * and delegates to the AI agent for processing.
 */
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  sendTextMessage,
  verifyWebhookSignature,
} from "./whatsappClient";

// Simple in-memory rate limiter (per-process, resets on redeploy)
// For production, use Upstash Redis in the HTTP handler
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 msgs/min per doctor

function checkRateLimit(doctorId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(doctorId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(doctorId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Handle an incoming WhatsApp webhook from Kapso.
 * Called from the HTTP route in http.ts.
 */
export const handleIncomingWebhook = internalAction({
  args: {
    body: v.string(),
    signature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Verify webhook signature
    if (!verifyWebhookSignature(args.body, args.signature || null)) {
      console.error("[WhatsApp] Invalid webhook signature");
      return;
    }

    // 2. Parse the webhook payload
    let payload: any;
    try {
      payload = JSON.parse(args.body);
    } catch {
      console.error("[WhatsApp] Invalid JSON payload");
      return;
    }

    // Parse message from payload — support Kapso batch, Kapso single, and Meta formats
    let message: any;

    if (payload.type === "whatsapp.message.received" && Array.isArray(payload.data)) {
      // Kapso batched format: { type: "whatsapp.message.received", data: [{ message: {...} }] }
      message = payload.data[0]?.message;
    } else if (payload.message && payload.message.kapso) {
      // Kapso single format: { message: {..., kapso: { direction }}, conversation: {...} }
      if (payload.message.kapso.direction === "outbound") {
        // Status update for a message we sent — skip
        return;
      }
      message = payload.message;
    } else if (payload.entry?.[0]?.changes?.[0]?.value?.messages) {
      // Meta Cloud API format: { entry: [{ changes: [{ value: { messages: [...] } }] }] }
      message = payload.entry[0].changes[0].value.messages[0];
    } else {
      console.log("[WhatsApp] Unrecognized payload format, skipping. Keys:", Object.keys(payload).join(", "));
      return;
    }

    if (!message) {
      console.log("[WhatsApp] No message in payload, skipping");
      return;
    }

    const fromNumber = message.from; // E.164 format (without +)
    const whatsappMessageId = message.id;
    const messageType = message.type;

    // Only handle text messages for now
    if (messageType !== "text") {
      await sendTextMessage(
        fromNumber,
        "I can only process text messages for now. Voice notes and images are coming soon!"
      );
      return;
    }

    const messageText = message.text?.body?.trim();
    if (!messageText) return;

    // 3. Check for deduplication
    const isProcessed = await ctx.runQuery(
      internal.whatsappLinks.isMessageProcessed,
      { whatsappMessageId }
    );
    if (isProcessed) {
      console.log("[WhatsApp] Duplicate message, skipping:", whatsappMessageId);
      return;
    }

    // 4. Check for link token (LINK_ prefix)
    if (messageText.startsWith("LINK_")) {
      const token = messageText.slice(5);
      const result = await ctx.runMutation(
        internal.whatsappLinks.matchLinkToken,
        {
          token,
          phoneNumber: fromNumber,
          whatsappId: fromNumber,
        }
      );

      if (result.matched) {
        await sendTextMessage(
          fromNumber,
          `✅ *WhatsApp linked to Pediascrybe!*\n\nYou can now chat with *ScrybeGPT* right here. Here's what I can do:\n\n📋 *Patient Info*\n• "How's patient [name]?"\n• "Summary of [name]"\n• "Vaccines due for [name]"\n\n📅 *Schedule*\n• "Who do I have today?"\n• "My schedule this week"\n• "Available slots for Monday"\n\n💊 *Clinical Support*\n• "Patient [name] has fever and ear pain"\n• "Prescribe for otitis media"\n• "Suggest labs for anemia"\n\n📝 *Create Records*\n• "New patient: [name], born [date], [sex]"\n• "Schedule [name] for Monday 9am"\n• "Add vitals: weight 14kg, temp 38.5"\n\n📊 *Reports & Analytics*\n• "How much did I make today?"\n• "Full report for [name]"\n• "Wrap up my day"\n\nJust type naturally — I understand French, English, and Creole!`
        );
      } else {
        await sendTextMessage(
          fromNumber,
          "This link code is invalid or expired. Please generate a new QR code from your Pediascrybe settings."
        );
      }
      return;
    }

    // 5. Look up doctor by phone number
    const doctorLink = await ctx.runQuery(
      internal.whatsappLinks.getDoctorByWhatsApp,
      { phoneNumber: fromNumber, whatsappId: fromNumber }
    );

    if (!doctorLink) {
      await sendTextMessage(
        fromNumber,
        "Your WhatsApp number is not linked to a Pediascrybe account.\n\nTo get started:\n1. Log in to Pediascrybe\n2. Go to Settings → WhatsApp\n3. Scan the QR code with your phone"
      );
      return;
    }

    const { doctorId } = doctorLink;

    // 6. Rate limiting (20 msgs/min per doctor)
    if (!checkRateLimit(doctorId)) {
      await sendTextMessage(
        fromNumber,
        "You're sending messages too quickly. Please wait a moment and try again."
      );
      return;
    }

    // 7. Check feature access (subscription tier)
    const access = await ctx.runQuery(
      internal.whatsappData.checkFeatureAccess,
      { doctorId }
    );

    if (!access.hasAccess) {
      await sendTextMessage(fromNumber, access.reason || "WhatsApp ScrybeGPT requires a Pro or Premium subscription.");
      return;
    }

    // 8. Check usage quota
    const quota = await ctx.runQuery(
      internal.whatsappData.checkQuotaByDoctorId,
      { doctorId }
    );

    if (!quota.allowed) {
      const remaining = quota.remaining;
      await sendTextMessage(
        fromNumber,
        quota.reason || "You've reached your monthly ScrybeGPT message limit. Upgrade for more."
      );
      return;
    }

    // 9. Get doctor name for the agent prompt
    const doctor: any = await ctx.runQuery(internal.whatsappData.getDoctorById, {
      doctorId,
    });
    const doctorName = doctor
      ? `${doctor.firstname} ${doctor.lastname}`
      : "Doctor";

    // 10. Delegate to AI agent (runs async via scheduler for fast webhook response)
    await ctx.scheduler.runAfter(0, internal.whatsappAgent.processMessage, {
      doctorId,
      doctorName,
      phoneNumber: fromNumber,
      messageText,
      whatsappMessageId,
    });
  },
});
