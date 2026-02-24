import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ==================== Vector Search ====================

// Store a document with embedding
export const storeDocument = internalMutation({
  args: {
    content: v.string(),
    embedding: v.array(v.float64()),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args): Promise<Id<"documents">> => {
    return await ctx.db.insert("documents", args);
  },
});

// Search documents by IDs
export const searchDocuments = internalQuery({
  args: {
    ids: v.array(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.ids.map((id) => ctx.db.get(id))
    );
    return results.filter((doc): doc is NonNullable<typeof doc> => doc !== null);
  },
});

// ==================== Internal AI Helpers ====================

// Generate embeddings using OpenAI (internal)
export const generateEmbeddingInternal = internalAction({
  args: { text: v.string() },
  handler: async (_ctx, args): Promise<number[]> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: args.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding as number[];
  },
});

// AI Chat completion (internal)
export const chatCompletionInternal = internalAction({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    patientContext: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<string> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    // Build messages with optional patient context
    const messages = [...args.messages];
    if (args.patientContext) {
      messages.unshift({
        role: "system" as const,
        content: `Patient Context:\n${args.patientContext}`,
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
  },
});

// ==================== Public AI Actions ====================

// Generate embeddings using OpenAI
export const generateEmbedding = action({
  args: { text: v.string() },
  handler: async (ctx, args): Promise<number[]> => {
    return await ctx.runAction(internal.ai.generateEmbeddingInternal, {
      text: args.text,
    });
  },
});

// Vector search action
export const vectorSearchDocuments = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Array<{ _id: Id<"documents">; _creationTime: number; content: string; embedding: number[]; metadata?: unknown }>> => {
    const results = await ctx.vectorSearch("documents", "by_embedding", {
      vector: args.embedding,
      limit: args.limit ?? 5,
    });
    
    // Get full documents
    const docs = await ctx.runQuery(internal.ai.searchDocuments, {
      ids: results.map((r: { _id: Id<"documents">; _score: number }) => r._id),
    });
    
    return docs;
  },
});

// Store patient/appointment data as searchable document
export const indexPatientData = action({
  args: {
    patientId: v.id("patients"),
    content: v.string(),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args): Promise<void> => {
    // Generate embedding for content
    const embedding = await ctx.runAction(internal.ai.generateEmbeddingInternal, {
      text: args.content,
    });

    // Store document with embedding
    await ctx.runMutation(internal.ai.storeDocument, {
      content: args.content,
      embedding,
      metadata: {
        ...args.metadata,
        patientId: args.patientId,
      },
    });
  },
});

// Search patient data using natural language
export const searchPatientData = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Array<{ _id: Id<"documents">; _creationTime: number; content: string; embedding: number[]; metadata?: unknown }>> => {
    // Generate embedding for query
    const embedding: number[] = await ctx.runAction(internal.ai.generateEmbeddingInternal, {
      text: args.query,
    });

    // Search documents using vector search
    const results = await ctx.vectorSearch("documents", "by_embedding", {
      vector: embedding,
      limit: args.limit ?? 5,
    });

    // Get full documents
    const docs = await ctx.runQuery(internal.ai.searchDocuments, {
      ids: results.map((r: { _id: Id<"documents">; _score: number }) => r._id),
    });

    return docs;
  },
});

// AI Chat completion (public)
export const chatCompletion = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    patientContext: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    return await ctx.runAction(internal.ai.chatCompletionInternal, {
      messages: args.messages,
      patientContext: args.patientContext,
    });
  },
});

// Generate diagnostic suggestions
export const generateDiagnostic = action({
  args: {
    symptoms: v.string(),
    patientHistory: v.optional(v.string()),
    vitals: v.optional(
      v.object({
        temperature: v.optional(v.number()),
        pulse: v.optional(v.number()),
        respiratory: v.optional(v.number()),
        weight: v.optional(v.number()),
        height: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args): Promise<string> => {
    const systemPrompt = `You are a medical AI assistant helping pediatricians with diagnostic suggestions. 
    Based on the symptoms and patient information provided, suggest possible diagnoses and recommended next steps.
    Always emphasize that these are suggestions only and the final diagnosis should be made by the treating physician.`;

    let userContent = `Symptoms: ${args.symptoms}`;
    if (args.patientHistory) {
      userContent += `\n\nPatient History: ${args.patientHistory}`;
    }
    if (args.vitals) {
      userContent += `\n\nVitals: ${JSON.stringify(args.vitals)}`;
    }

    const response = await ctx.runAction(internal.ai.chatCompletionInternal, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    return response;
  },
});

// Generate prescription suggestions
export const generatePrescription = action({
  args: {
    diagnosis: v.string(),
    patientAge: v.optional(v.string()),
    patientWeight: v.optional(v.number()),
    allergies: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const systemPrompt = `You are a medical AI assistant helping pediatricians with prescription suggestions.
    Based on the diagnosis provided, suggest appropriate medications with dosages suitable for pediatric patients.
    Always consider age, weight, and any allergies when suggesting medications.
    Always emphasize that these are suggestions only and the final prescription should be determined by the treating physician.`;

    let userContent = `Diagnosis: ${args.diagnosis}`;
    if (args.patientAge) {
      userContent += `\nPatient Age: ${args.patientAge}`;
    }
    if (args.patientWeight) {
      userContent += `\nPatient Weight: ${args.patientWeight} kg`;
    }
    if (args.allergies) {
      userContent += `\nKnown Allergies: ${args.allergies}`;
    }

    const response = await ctx.runAction(internal.ai.chatCompletionInternal, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    return response;
  },
});

// Generate exam recommendations
export const generateExamRecommendations = action({
  args: {
    symptoms: v.string(),
    preliminaryDiagnosis: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const systemPrompt = `You are a medical AI assistant helping pediatricians with exam and test recommendations.
    Based on the symptoms and preliminary diagnosis, suggest appropriate laboratory tests, imaging studies, or other examinations.
    Always emphasize that these are suggestions only and the final decision should be made by the treating physician.`;

    let userContent = `Symptoms: ${args.symptoms}`;
    if (args.preliminaryDiagnosis) {
      userContent += `\nPreliminary Diagnosis: ${args.preliminaryDiagnosis}`;
    }

    const response = await ctx.runAction(internal.ai.chatCompletionInternal, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    return response;
  },
});
