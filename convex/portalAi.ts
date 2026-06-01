import { query, action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ==================== Constants ====================

const SYSTEM_PROMPT = `You are a pediatric health educator helping parents understand their child's medical information. You explain clearly in plain, reassuring language.

Rules:
- NEVER diagnose or suggest treatments
- ONLY explain what the doctor has already documented
- Use simple language (5th grade reading level)
- Be reassuring but honest
- Include practical tips (storage, administration, what to watch for)
- Keep explanations concise (3-5 paragraphs max)
- Format with clear headings using markdown`;

const FREE_LIMIT = 5;
const PREMIUM_LIMIT = 50;

// ==================== Helpers ====================

// Simple hash for cache lookup
function hashContext(type: string, data: string): string {
  let hash = 0;
  const str = `${type}:${data}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `${type}_${hash.toString(36)}`;
}

// Get current period string (YYYY-MM)
function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ==================== Internal Queries ====================

// Get patient auth user for authorization
export const getPatientAuthUser = internalQuery({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();
    if (!appUser || appUser.role !== "patient") return null;
    return appUser;
  },
});

// Check if user has access to patient
export const verifyPatientAccessInternal = internalQuery({
  args: { authUserId: v.string(), patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("patientAccounts")
      .withIndex("by_authUserId_patientId", (q) =>
        q.eq("authUserId", args.authUserId).eq("patientId", args.patientId)
      )
      .first();
    return !!link;
  },
});

// Get cached explanation
export const getCachedExplanation = internalQuery({
  args: { contextHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiExplanations")
      .withIndex("by_contextHash", (q) => q.eq("contextHash", args.contextHash))
      .first();
  },
});

// Get user's current usage
export const getUsageInternal = internalQuery({
  args: { authUserId: v.string(), period: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patientUsage")
      .withIndex("by_authUserId_period", (q) =>
        q.eq("authUserId", args.authUserId).eq("period", args.period)
      )
      .first();
  },
});

// Get user's subscription
export const getSubscriptionInternal = internalQuery({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patientSubscriptions")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();
  },
});

// ==================== Internal Mutations ====================

// Store explanation in cache
export const storeExplanation = internalMutation({
  args: {
    type: v.union(
      v.literal("medication"),
      v.literal("diagnostic"),
      v.literal("lab_exam"),
      v.literal("growth"),
      v.literal("vaccination")
    ),
    contextHash: v.string(),
    patientId: v.id("patients"),
    appointmentId: v.optional(v.id("appointments")),
    explanation: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiExplanations", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Increment usage counter
export const incrementUsage = internalMutation({
  args: { authUserId: v.string(), period: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("patientUsage")
      .withIndex("by_authUserId_period", (q) =>
        q.eq("authUserId", args.authUserId).eq("period", args.period)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        aiExplanations: existing.aiExplanations + 1,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("patientUsage", {
        authUserId: args.authUserId,
        period: args.period,
        aiExplanations: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// ==================== Public Queries ====================

// Check if user can use AI (subscription + free tier)
export const canUseAI = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { allowed: false, remaining: 0, limit: FREE_LIMIT };

    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();
    if (!appUser || appUser.role !== "patient") {
      return { allowed: false, remaining: 0, limit: FREE_LIMIT };
    }

    // Check subscription
    const subscription = await ctx.db
      .query("patientSubscriptions")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    const isPremium =
      subscription?.plan === "premium" &&
      (subscription.status === "active" || subscription.status === "trialing");

    // Check usage against applicable limit (premium = 50/mo, free = 5/mo)
    const period = getCurrentPeriod();
    const usage = await ctx.db
      .query("patientUsage")
      .withIndex("by_authUserId_period", (q) =>
        q.eq("authUserId", identity.subject).eq("period", period)
      )
      .first();

    const used = usage?.aiExplanations ?? 0;
    const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
    return {
      allowed: used < limit,
      remaining: Math.max(0, limit - used),
      limit,
      used,
      isPremium,
    };
  },
});

// Get a cached explanation by hash (for instant loading)
export const getExplanation = query({
  args: { contextHash: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("aiExplanations")
      .withIndex("by_contextHash", (q) => q.eq("contextHash", args.contextHash))
      .first();
  },
});

// ==================== AI Explanation Actions ====================

// Main entry point: request an AI explanation
export const requestExplanation = action({
  args: {
    type: v.union(
      v.literal("medication"),
      v.literal("diagnostic"),
      v.literal("lab_exam"),
      v.literal("growth"),
      v.literal("vaccination")
    ),
    context: v.string(), // JSON string of the data to explain
    patientId: v.id("patients"),
    appointmentId: v.optional(v.id("appointments")),
  },
  handler: async (ctx, args): Promise<{ explanation: string; contextHash: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify patient access
    const hasAccess = await ctx.runQuery(internal.portalAi.verifyPatientAccessInternal, {
      authUserId: identity.subject,
      patientId: args.patientId,
    });
    if (!hasAccess) throw new Error("Not authorized");

    // Check cache first
    const contextHash = hashContext(args.type, args.context);
    const cached = await ctx.runQuery(internal.portalAi.getCachedExplanation, { contextHash });
    if (cached) {
      return { explanation: cached.explanation, contextHash };
    }

    // Check subscription/quota
    const subscription = await ctx.runQuery(internal.portalAi.getSubscriptionInternal, {
      authUserId: identity.subject,
    });
    const isPremium =
      subscription?.plan === "premium" &&
      (subscription.status === "active" || subscription.status === "trialing");

    const period = getCurrentPeriod();
    const usage = await ctx.runQuery(internal.portalAi.getUsageInternal, {
      authUserId: identity.subject,
      period,
    });
    const used = usage?.aiExplanations ?? 0;
    const applicableLimit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
    if (used >= applicableLimit) {
      throw new Error(isPremium ? "PREMIUM_LIMIT_REACHED" : "FREE_LIMIT_REACHED");
    }

    // Build the type-specific prompt
    const userPrompt = buildPrompt(args.type, args.context);

    // Call OpenAI via the existing internal action
    const explanation = await ctx.runAction(internal.ai.chatCompletionInternal, {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    // Store in cache
    await ctx.runMutation(internal.portalAi.storeExplanation, {
      type: args.type,
      contextHash,
      patientId: args.patientId,
      appointmentId: args.appointmentId,
      explanation,
    });

    // Increment usage (only for non-cached)
    await ctx.runMutation(internal.portalAi.incrementUsage, {
      authUserId: identity.subject,
      period,
    });

    return { explanation, contextHash };
  },
});

// ==================== Prompt Builders ====================

function buildPrompt(type: string, contextJson: string): string {
  const data = JSON.parse(contextJson);

  switch (type) {
    case "medication":
      return buildMedicationPrompt(data);
    case "diagnostic":
      return buildDiagnosticPrompt(data);
    case "lab_exam":
      return buildLabExamPrompt(data);
    case "growth":
      return buildGrowthPrompt(data);
    case "vaccination":
      return buildVaccinationPrompt(data);
    default:
      return `Please explain the following medical information to a parent:\n\n${contextJson}`;
  }
}

function buildMedicationPrompt(data: {
  medications: Array<{ drug: string; count?: number; unit?: string; posology?: string }>;
  patientAge?: string;
  patientWeight?: number;
}): string {
  const medList = data.medications
    .map(
      (m, i) =>
        `${i + 1}. ${m.drug}${m.count ? `, ${m.count} ${m.unit || "units"}` : ""}${
          m.posology ? ` — ${m.posology}` : ""
        }`
    )
    .join("\n");

  return `A doctor has prescribed the following medications for a child${
    data.patientAge ? ` (age: ${data.patientAge})` : ""
  }${data.patientWeight ? ` (weight: ${data.patientWeight}kg)` : ""}:

${medList}

Please explain each medication to the parent:
- What each medication is commonly used for
- How to administer it properly
- Common side effects to watch for
- Any storage instructions
- When to contact the doctor`;
}

function buildDiagnosticPrompt(data: {
  findings?: string;
  recommendation?: string;
  motif?: string;
}): string {
  let prompt = "A doctor has documented the following after examining a child:\n\n";

  if (data.motif) prompt += `Reason for visit: ${data.motif}\n\n`;
  if (data.findings) prompt += `Findings: ${data.findings}\n\n`;
  if (data.recommendation) prompt += `Recommendations: ${data.recommendation}\n\n`;

  prompt += `Please explain these findings to the parent:
- What the findings mean in simple terms
- Why the doctor made these recommendations
- What the parent should do at home
- When to seek follow-up care`;

  return prompt;
}

function buildLabExamPrompt(data: {
  exams: Array<{ examName?: string; exam?: string } | string>;
}): string {
  const examList = data.exams
    .map((e, i) => {
      const name = typeof e === "string" ? e : (e.examName ?? e.exam ?? "");
      return `${i + 1}. ${name}`;
    })
    .join("\n");

  return `A doctor has ordered the following lab exams/tests for a child:

${examList}

Please explain each test to the parent:
- What each test checks for
- How to prepare the child (fasting, hydration, etc.)
- What to expect during the test
- How long results typically take
- What the results might indicate`;
}

function buildGrowthPrompt(data: {
  measurements: Array<{
    date: number;
    weight?: number;
    height?: number;
    head?: number;
    ageMonths: number;
  }>;
  patientSex?: string;
  birthdate?: number;
}): string {
  const latest = data.measurements[data.measurements.length - 1];
  const measurementList = data.measurements
    .map(
      (m) =>
        `- Age ${m.ageMonths}mo: ${m.weight ? `Weight ${m.weight}kg` : ""}${
          m.height ? ` Height ${m.height}cm` : ""
        }${m.head ? ` Head ${m.head}cm` : ""}`
    )
    .join("\n");

  return `Here is the growth data for a${data.patientSex ? ` ${data.patientSex}` : ""} child:

${measurementList}

Most recent measurements (age ${latest?.ageMonths ?? "?"}mo):
${latest?.weight ? `- Weight: ${latest.weight} kg` : ""}
${latest?.height ? `- Height: ${latest.height} cm` : ""}
${latest?.head ? `- Head circumference: ${latest.head} cm` : ""}

Please provide a narrative summary:
- How the child is growing overall
- Whether the growth trend looks consistent
- General information about growth patterns at this age
- When parents should discuss growth concerns with their doctor
Note: Do NOT provide specific percentile assessments.`;
}

function buildVaccinationPrompt(data: {
  vaccineName: string;
  doseType?: string;
  date: number;
  route?: string;
  manufacturer?: string;
  notes?: string;
}): string {
  return `A child received the following vaccination:

- Vaccine: ${data.vaccineName}
- Dose type: ${data.doseType || "Standard"}
- Date given: ${new Date(data.date).toLocaleDateString()}
- Route: ${data.route || "Not specified"}
${data.manufacturer ? `- Manufacturer: ${data.manufacturer}` : ""}
${data.notes ? `- Notes: ${data.notes}` : ""}

Please explain to the parent:
- What disease(s) this vaccine protects against
- Why this vaccine is given at this age/stage
- Common side effects and how to manage them
- What to watch for after vaccination
- When the next dose is typically due (if applicable)`;
}
