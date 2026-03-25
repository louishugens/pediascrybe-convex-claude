"use node";

/**
 * Clinical Decision Log — Actions (Node runtime)
 *
 * Generates embeddings for RAG retrieval and extracts preference rules
 * from doctor edits using a nano model.
 */
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Generate embedding for a clinical decision (background job).
 */
export const generateDecisionEmbedding = internalAction({
  args: { decisionId: v.id("clinicalDecisionLog") },
  handler: async (ctx, args) => {
    const decision: any = await ctx.runQuery(
      internal.whatsappDecisionLog.getDecisionById,
      { decisionId: args.decisionId }
    );

    if (!decision) return;

    // Build text for embedding
    const text = [
      `Type: ${decision.decisionType}`,
      `Conditions: ${decision.conditionTags.join(", ")}`,
      `Proposed: ${decision.proposed}`,
      `Final: ${decision.final}`,
      `Outcome: ${decision.outcome}`,
      decision.edits ? `Edits: ${decision.edits}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn("[DecisionLog] No OPENAI_API_KEY, skipping embedding");
        return;
      }

      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text,
          dimensions: 1536,
        }),
      });

      if (!response.ok) {
        console.error("[DecisionLog] Embedding API error:", await response.text());
        return;
      }

      const data = await response.json();
      const embedding = data.data?.[0]?.embedding;

      if (embedding) {
        await ctx.runMutation(
          internal.whatsappDecisionLog.updateDecisionEmbedding,
          {
            decisionId: args.decisionId,
            embedding,
          }
        );
      }
    } catch (error) {
      console.error("[DecisionLog] Failed to generate embedding:", error);
    }
  },
});

/**
 * Extract preference rule from a clinical edit using nano model.
 */
export const extractPreferenceFromEdit = internalAction({
  args: {
    doctorId: v.id("doctors"),
    decisionType: v.string(),
    proposed: v.string(),
    final: v.string(),
    edits: v.string(),
    conditionTags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return;

      const prompt = `A doctor edited a clinical ${args.decisionType} proposal.

Original proposal: ${args.proposed}
Doctor's edits: ${args.edits}
Final version: ${args.final}
Conditions: ${args.conditionTags.join(", ")}

Extract a concise preference rule (max 20 words) that captures what the doctor prefers. Examples:
- "Prefers azithromycin 5ml for children under 5y with otitis"
- "Always adds ibuprofen PRN for ear infections"
- "Avoids cephalosporins for UTI, prefers nitrofurantoin"

If no clear preference pattern, respond with "none".

Rule:`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-nano",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 50,
          temperature: 0.3,
        }),
      });

      if (!response.ok) return;

      const data = await response.json();
      const rule = data.choices?.[0]?.message?.content?.trim();

      if (rule && rule.toLowerCase() !== "none" && rule.length > 5) {
        const category = args.decisionType === "medication"
          ? "dosing"
          : args.decisionType === "diagnostic"
            ? "drug_choice"
            : "lab_preference";

        await ctx.runMutation(internal.whatsappPreferences.upsertPreference, {
          doctorId: args.doctorId,
          category,
          condition: args.conditionTags[0] || undefined,
          rule,
        });
      }
    } catch (error) {
      console.error("[DecisionLog] Failed to extract preference:", error);
    }
  },
});
