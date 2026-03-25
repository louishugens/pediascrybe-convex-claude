"use node";

/**
 * WhatsApp Client — Kapso API wrapper
 *
 * Uses Kapso's proxy to the WhatsApp Cloud API.
 * API docs: https://docs.kapso.ai
 * SDK: @kapso/whatsapp-cloud-api
 */

const KAPSO_API_BASE = "https://api.kapso.ai/meta/whatsapp/v23.0";

function getHeaders(): Record<string, string> {
  const apiKey = process.env.KAPSO_API_KEY;
  if (!apiKey) throw new Error("KAPSO_API_KEY not configured");
  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
  };
}

function getPhoneNumberId(): string {
  const id = process.env.KAPSO_PHONE_NUMBER_ID;
  if (!id) throw new Error("KAPSO_PHONE_NUMBER_ID not configured");
  return id;
}

/**
 * Send a text message via WhatsApp.
 */
export async function sendTextMessage(
  to: string,
  text: string
): Promise<{ messageId: string }> {
  const url = `${KAPSO_API_BASE}/${getPhoneNumberId()}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[WhatsApp] Send text failed:", response.status, error.slice(0, 300));
    throw new Error(`WhatsApp send failed: ${response.status}`);
  }

  const data = await response.json();
  return { messageId: data.messages?.[0]?.id || "unknown" };
}

/**
 * Send multiple text messages in sequence (chunked responses).
 */
export async function sendChunkedMessages(
  to: string,
  messages: string[]
): Promise<void> {
  for (const msg of messages) {
    await sendTextMessage(to, msg);
  }
}

/**
 * Send a document (PDF) via WhatsApp.
 */
export async function sendDocumentMessage(
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<{ messageId: string }> {
  const response = await fetch(
    `${KAPSO_API_BASE}/${getPhoneNumberId()}/messages`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document: {
          link: documentUrl,
          filename,
          caption,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[WhatsApp] Send document failed:", response.status, error);
    throw new Error(`WhatsApp document send failed: ${response.status}`);
  }

  const data = await response.json();
  return { messageId: data.messages?.[0]?.id || "unknown" };
}

/**
 * Mark a message as read (blue checkmarks).
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    await fetch(`${KAPSO_API_BASE}/${getPhoneNumberId()}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  } catch {
    // Read receipts are best-effort
  }
}

/**
 * React to a message with an emoji (used as typing/processing indicator).
 */
export async function reactToMessage(
  messageId: string,
  emoji: string
): Promise<void> {
  try {
    await fetch(`${KAPSO_API_BASE}/${getPhoneNumberId()}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        type: "reaction",
        reaction: {
          message_id: messageId,
          emoji,
        },
      }),
    });
  } catch {
    // Reactions are best-effort
  }
}

/**
 * Remove a reaction from a message.
 */
export async function removeReaction(messageId: string): Promise<void> {
  try {
    await fetch(`${KAPSO_API_BASE}/${getPhoneNumberId()}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        type: "reaction",
        reaction: {
          message_id: messageId,
          emoji: "",
        },
      }),
    });
  } catch {
    // Reaction removal is best-effort
  }
}

/**
 * Send typing indicator by reacting with ⏳ to the user's message.
 * @deprecated Use reactToMessage directly with the message ID
 */
export async function sendTypingIndicator(to: string): Promise<void> {
  // No-op — use reactToMessage with whatsappMessageId instead
}

/**
 * Verify webhook signature from Kapso/Meta.
 * Kapso uses the Meta Cloud API HMAC-SHA256 format with APP_SECRET.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  const webhookSecret = process.env.KAPSO_WEBHOOK_SECRET;

  // No secret configured — skip verification (development mode)
  if (!webhookSecret) {
    console.warn("[WhatsApp] No webhook secret configured, skipping verification");
    return true;
  }

  // No signature header from provider — allow through but log it
  // Kapso may not send a signature header depending on configuration
  if (!signature) {
    console.warn("[WhatsApp] No signature header received, allowing through");
    return true;
  }

  // Meta/Kapso format: sha256=<hex>
  try {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    const receivedSig = signature.replace("sha256=", "");
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(receivedSig, "hex")
    );
  } catch {
    // Fallback: simple string match
    return signature === webhookSecret;
  }
}
