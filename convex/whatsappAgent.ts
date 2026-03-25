"use node";

/**
 * WhatsApp ScrybeGPT Agent
 *
 * AI agent using Vercel AI SDK's generateText with tool calling.
 * Orchestrates patient lookups, schedule checks, clinical proposals,
 * and all other WhatsApp interactions.
 */
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { generateText, stepCountIs } from "ai";
import { gateway } from "ai";
import { buildSystemPrompt } from "./whatsappPrompts";
import { createPatientTools } from "./whatsappTools/patientTools";
import { createScheduleTools } from "./whatsappTools/scheduleTools";
import { createMedicalTools } from "./whatsappTools/medicalTools";
import { createChartReportTools } from "./whatsappTools/chartReportTools";
import { createWriteTools } from "./whatsappTools/writeTools";
import { createBackgroundTools } from "./whatsappTools/backgroundTools";
import { splitIntoChunks, markdownToWhatsApp } from "./whatsappFormat";
import {
  sendTextMessage,
  sendChunkedMessages,
  markMessageAsRead,
} from "./whatsappClient";

/**
 * Process an incoming WhatsApp message through the AI agent.
 * Called by the webhook handler after auth + dedup checks.
 */
export const processMessage = internalAction({
  args: {
    doctorId: v.id("doctors"),
    doctorName: v.string(),
    phoneNumber: v.string(),
    messageText: v.string(),
    whatsappMessageId: v.string(),
  },
  handler: async (ctx, args) => {
    const { doctorId, doctorName, phoneNumber, messageText, whatsappMessageId } =
      args;

    try {
      // 1. Mark as read
      await markMessageAsRead(whatsappMessageId);

      // 2. Store the incoming message
      await ctx.runMutation(internal.whatsappData.storeMessage, {
        doctorId,
        whatsappMessageId,
        role: "user",
        content: messageText,
      });

      // 3. Load conversation history
      const history = await ctx.runQuery(
        internal.whatsappData.getConversationHistory,
        { doctorId, limit: 20 }
      );

      // 4. Check for pending actions
      const pendingAction = await ctx.runQuery(
        internal.whatsappData.getLatestPendingAction,
        { doctorId }
      );

      // 5. Load doctor preferences (top 10 by confidence)
      const preferences = await ctx.runQuery(
        internal.whatsappPreferences.getTopPreferences,
        { doctorId, limit: 10 }
      );

      const prefRules = preferences.map((p: any) => p.rule);

      // 6. Build system prompt
      const systemPrompt = buildSystemPrompt({
        doctorName,
        preferences: prefRules,
        hasPendingAction: !!pendingAction,
      });

      // 7. Build conversation messages for the AI
      const messages: Array<{ role: "user" | "assistant"; content: string }> =
        history.map((m: { role: "user" | "assistant"; content: string }) => ({
          role: m.role,
          content: m.content,
        }));

      // Add pending action context if exists
      if (pendingAction) {
        messages.push({
          role: "assistant",
          content: `[SYSTEM: There is a pending ${pendingAction.action} proposal (ID: ${pendingAction._id}). Preview: ${pendingAction.preview}. The doctor's next message may be confirming, editing, or cancelling this proposal.]`,
        });
      }

      // Add the current message
      messages.push({ role: "user", content: messageText });

      // 8. Create tools scoped to this doctor
      const toolCtx = { ctx, doctorId };
      const tools = {
        ...createPatientTools(toolCtx),
        ...createScheduleTools(toolCtx),
        ...createMedicalTools(toolCtx),
        ...createChartReportTools(toolCtx),
        ...createWriteTools(toolCtx),
        ...createBackgroundTools({ ...toolCtx, phoneNumber }),
      };

      // 9. Run the agent with timeout handling and metrics
      const agentStartTime = Date.now();
      const modelId = process.env.AI_MODEL_ID || "anthropic/claude-sonnet-4-6";

      const result = await generateText({
        model: gateway(modelId),
        system: systemPrompt,
        messages,
        tools,
        stopWhen: stepCountIs(8),
      });

      // 10. Log agent metrics
      const agentEndTime = Date.now();
      const stepCount = result.steps?.length || 0;
      const toolCallSummary =
        result.steps
          ?.flatMap((s) => s.toolCalls || [])
          .map((tc) => tc.toolName) || [];

      console.log(`[WhatsApp Agent] doctorId=${doctorId} latency=${agentEndTime - agentStartTime}ms steps=${stepCount} tools=[${toolCallSummary.join(",")}] msgLen=${result.text.length}`);

      // 11. Format and send response
      let finalText = result.text;

      // If the model returned no text but used tools, build a fallback from the last tool result
      if (!finalText || finalText.trim().length === 0) {
        const lastStep = result.steps?.[result.steps.length - 1];
        const lastToolResult = lastStep?.toolResults?.[lastStep.toolResults.length - 1] as any;
        if (lastToolResult?.result) {
          finalText = typeof lastToolResult.result === "string"
            ? lastToolResult.result
            : JSON.stringify(lastToolResult.result, null, 2);
        } else {
          finalText = "I processed your request but couldn't generate a response. Could you try rephrasing?";
        }
      }

      const responseText = markdownToWhatsApp(finalText);
      const chunks = splitIntoChunks(responseText);

      if (chunks.length === 1) {
        await sendTextMessage(phoneNumber, chunks[0]);
      } else {
        await sendChunkedMessages(phoneNumber, chunks);
      }

      await ctx.runMutation(internal.whatsappData.storeMessage, {
        doctorId,
        whatsappMessageId: `resp_${whatsappMessageId}`,
        role: "assistant",
        content: result.text,
        toolCalls:
          toolCallSummary.length > 0
            ? JSON.stringify(toolCallSummary)
            : undefined,
      });

      // 12. Increment usage
      await ctx.runMutation(internal.whatsappData.incrementUsageByDoctorId, {
        doctorId,
        field: "scrybegptMessages",
      });
    } catch (error: any) {
      console.error("[WhatsApp Agent] Error processing message:", error);

      // Send error response to doctor
      try {
        await sendTextMessage(
          phoneNumber,
          "I'm having trouble processing your request right now. Please try again in a moment."
        );
      } catch {
        // If we can't even send the error message, just log
        console.error("[WhatsApp Agent] Failed to send error message");
      }
    }
  },
});
