# Vercel AI Gateway, Workflow & Fault Tolerance Implementation Plan

## 🎉 Implementation Status: COMPLETE

All phases have been successfully implemented! The application now has:
- ✅ Multi-provider support via Vercel AI Gateway with automatic fallbacks
- ✅ Fault-tolerant AI infrastructure with retry logic and error handling
- ✅ Redis caching for expensive operations (exams, prescriptions, conditions)
- ✅ Durable workflow execution for chat endpoint (bypasses Vercel timeout limits)
- ✅ Migrated to AI SDK v6 (`streamText` with `Output.array()` instead of deprecated `streamObject`)
- ✅ Standardized error handling and structured logging
- ✅ Updated timeouts: 60s for streaming routes, 45s for object generation

### Important Notes:
- **AI SDK v6 Migration**: All routes now use `streamText` with `Output.array()` instead of the deprecated `streamObject` and `generateObject` functions
- **Workflow Dependencies**: `workflow@^4.0.1-beta.47` and `@workflow/ai@^4.0.1-beta.51` are installed
- **Next.js Config**: Updated with `withWorkflow()` wrapper for workflow support
- **Caching TTLs**: Conditions (1 day), Exams (1 hour), Prescriptions (1 hour)

## TODO Checklist

### Phase 1: AI Provider Infrastructure ✅
- [x] Create `/lib/ai/providers.ts` - Gateway config with provider switching
- [x] Create `/lib/ai/middleware/retry.ts` - Retry middleware with exponential backoff
- [x] Create `/lib/ai/models.ts` - Pre-configured robust models

### Phase 2: Migrate Endpoints to AI Gateway ✅
- [x] Update `/app/api/ai/chat/[patientId]/route.ts` - Use gateway + fallbacks (migrated to Vercel Workflow)
- [x] Update `/app/api/ai/diagnostic/route.ts` - Use gateway + fallbacks
- [x] Update `/app/api/ai/exams/route.ts` - Use gateway + fallbacks (migrated to AI SDK v6 with caching)
- [x] Update `/app/api/ai/prescriptions/route.ts` - Use gateway + fallbacks (migrated to AI SDK v6 with caching)
- [x] Update `/app/api/ai/report/route.ts` - Use gateway + fallbacks
- [x] Update `/app/api/classify-conditions/route.ts` - Use gateway + fallbacks (migrated to AI SDK v6)
- [x] Migrate `/app/api/diagnostic/route.ts` (legacy) - Convert from raw OpenAI to AI SDK
- [x] Migrate `/app/api/completion/route.ts` (legacy) - Convert from raw OpenAI to AI SDK

### Phase 3: Timeout & Streaming Improvements ✅
- [x] Update maxDuration: streaming routes to 60s, object gen to 45s
- [x] Convert `classify-conditions` from `generateObject` to `streamText` with `Output.array()` (AI SDK v6)

### Phase 4: Caching Strategy ✅
- [x] Create `/lib/ai/cache.ts` - Redis caching utilities
- [x] Add caching to `/app/api/ai/exams/route.ts`
- [x] Add caching to `/app/api/ai/prescriptions/route.ts`

### Phase 5: Error Handling & Observability ✅
- [x] Create `/lib/ai/errors.ts` - Standardized error handling
- [x] Create `/lib/ai/logging.ts` - Structured logging

### Phase 6: Vercel Workflow for Chat ✅
- [x] Create `/app/workflows/medical-chat/workflow.ts` - Durable workflow
- [x] Update chat route to use workflow

---

## Goals
1. **Fault tolerance** - Handle API failures with retries and fallbacks
2. **Latency tolerance** - Handle slow responses without timeouts
3. **Avoid Vercel timeouts** - The 30s limit is tight for complex medical AI
4. **Speed up responses** - Caching and optimizations
5. **Multi-provider support** - Easy switching between OpenAI, Anthropic, Google as primary
6. **Durable execution** - Vercel Workflow for complex multi-step chat operations

## User Preferences
- **Providers:** Multi-provider with ability to test different providers as primary
- **API Keys:** Vercel managed gateway (unified billing)
- **Workflow:** Yes, implement for chat endpoint

---

## Current State

| Endpoint | Model | maxDuration | Issues |
|----------|-------|-------------|--------|
| `/api/ai/chat/[patientId]` | gpt-5-mini | 30s | No retries, no fallback |
| `/api/ai/diagnostic` | gpt-5-mini | 30s | No retries, no fallback |
| `/api/ai/exams` | gpt-4.1 | 30s | No retries, no fallback, no cache |
| `/api/ai/prescriptions` | gpt-5-mini | 30s | No retries, no fallback, no cache |
| `/api/ai/report` | gpt-4o-mini | None | No timeout set |
| `/api/classify-conditions` | gpt-4.1-nano | None | Has Redis cache (good!) |
| `/api/diagnostic` (legacy) | gpt-4.1 | None | Uses raw OpenAI SDK |
| `/api/completion` (legacy) | gpt-4-1106-preview | None | Uses raw OpenAI SDK |

**Already available:** `AI_GATEWAY_API_KEY` in env, `@upstash/redis`, AI SDK v6.0.5

---

## Implementation Details

### Phase 1: Create AI Provider Infrastructure

**Create `/lib/ai/providers.ts`:**
```typescript
import { gateway } from 'ai';

// Primary provider from env (openai, anthropic, or google)
const PRIMARY_PROVIDER = process.env.AI_PRIMARY_PROVIDER || 'openai';

// Model tiers with provider-specific models
const MODEL_TIERS = {
  fast: {
    openai: 'openai/gpt-4o-mini',
    anthropic: 'anthropic/claude-3-5-haiku-latest',
    google: 'google/gemini-2.0-flash',
  },
  balanced: {
    openai: 'openai/gpt-5-mini',
    anthropic: 'anthropic/claude-sonnet-4',
    google: 'google/gemini-2.0-flash',
  },
  powerful: {
    openai: 'openai/gpt-4.1',
    anthropic: 'anthropic/claude-opus-4',
    google: 'google/gemini-2.0-pro',
  },
} as const;

export function getModel(tier: 'fast' | 'balanced' | 'powerful') {
  const primary = MODEL_TIERS[tier][PRIMARY_PROVIDER];
  const fallbacks = Object.entries(MODEL_TIERS[tier])
    .filter(([provider]) => provider !== PRIMARY_PROVIDER)
    .map(([_, model]) => model);

  return {
    model: gateway(primary),
    providerOptions: {
      gateway: { models: fallbacks },
    },
  };
}
```

**Create `/lib/ai/middleware/retry.ts`:**
```typescript
import type { LanguageModelV3Middleware } from 'ai';

export function createRetryMiddleware(maxRetries = 3): LanguageModelV3Middleware {
  return {
    wrapGenerate: async ({ doGenerate }) => {
      let lastError: Error | undefined;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await doGenerate();
        } catch (error) {
          lastError = error as Error;
          const retryable = /429|500|502|503|rate_limit|timeout/.test(lastError.message);
          if (!retryable || attempt === maxRetries) throw lastError;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
      throw lastError;
    },
    wrapStream: async ({ doStream }) => {
      let lastError: Error | undefined;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await doStream();
        } catch (error) {
          lastError = error as Error;
          const retryable = /429|500|502|503|rate_limit|timeout/.test(lastError.message);
          if (!retryable || attempt === maxRetries) throw lastError;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
      throw lastError;
    },
  };
}
```

### Phase 2: Endpoint Migration Example

**Before (current):**
```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const result = streamText({
  model: openai('gpt-5-mini'),
  // ...
});
```

**After:**
```typescript
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';

const result = streamText({
  ...getModel('balanced'),
  // ...
});
```

### Phase 4: Caching Example

**Create `/lib/ai/cache.ts`:**
```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCachedOrGenerate<T>(
  cacheKey: string,
  generator: () => Promise<T>,
  ttlSeconds = 3600
): Promise<T> {
  const cached = await redis.get(cacheKey);
  if (cached) return cached as T;

  const result = await generator();
  await redis.set(cacheKey, result, { ex: ttlSeconds });
  return result;
}

export function hashInputs(inputs: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(inputs)).toString('base64').slice(0, 64);
}
```

---

## Model Mapping with Fallbacks

Primary provider configurable via `AI_PRIMARY_PROVIDER` env var (openai/anthropic/google).

| Use Case | Tier | OpenAI | Anthropic | Google |
|----------|------|--------|-----------|--------|
| Chat | balanced | gpt-5-mini | claude-sonnet-4 | gemini-2.0-flash |
| Diagnostic | balanced | gpt-5-mini | claude-sonnet-4 | gemini-2.0-flash |
| Exams | powerful | gpt-4.1 | claude-opus-4 | gemini-2.0-pro |
| Prescriptions | balanced | gpt-5-mini | claude-sonnet-4 | gemini-2.0-flash |
| Report | fast | gpt-4o-mini | claude-3-5-haiku-latest | gemini-2.0-flash |
| Classify | fast | gpt-4.1-nano | claude-3-5-haiku-latest | gemini-2.0-flash |

---

## New File Structure

```
/lib/ai/
  providers.ts      # Gateway config & model aliases
  models.ts         # Pre-configured robust models
  cache.ts          # Redis caching utilities
  errors.ts         # Error handling
  logging.ts        # Structured logging
  middleware/
    retry.ts        # Retry middleware
```

---

## Verification Plan

1. **Test retries:** Simulate 429/500 errors, verify automatic retry
2. **Test fallbacks:** Block OpenAI, verify Anthropic fallback works
3. **Test caching:** Call exams endpoint twice, verify cache hit
4. **Test timeouts:** Ensure long operations complete within maxDuration
5. **Test streaming:** Verify smooth streaming behavior maintained

---

## Phase 6: Vercel Workflow for Chat

### Step 1: Install Dependencies

```bash
npm i workflow @workflow/ai
```

Update `next.config.ts`:
```typescript
import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... rest of your Next.js config
};

export default withWorkflow(nextConfig);
```

### Step 2: Create Workflow Function

**Create `/app/workflows/medical-chat/route.ts`:**
```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { convertToModelMessages, type ModelMessage, type UIMessageChunk } from "ai";
import { getModel } from "@/lib/ai/providers";
import { createRetryMiddleware } from "@/lib/ai/middleware/retry";
import { medicalTools } from "./steps/tools";
import { getPatientContext } from "./steps/patient";

const MEDICAL_SYSTEM_PROMPT = `You are a medical assistant helping healthcare professionals...
[existing system prompt content]`;

export async function medicalChatWorkflow(
  patientId: string,
  messages: ModelMessage[]
) {
  "use workflow";

  const writable = getWritable<UIMessageChunk>();

  // Step 1: Fetch patient context (durable)
  const patientContext = await getPatientContext(patientId);

  // Step 2: Create agent with medical tools
  const agent = new DurableAgent({
    model: getModel("balanced").model,
    system: `${MEDICAL_SYSTEM_PROMPT}\n\nPatient Context:\n${patientContext}`,
    tools: medicalTools,
    middleware: [createRetryMiddleware(3)],
  });

  // Step 3: Stream response (resumable)
  await agent.stream({
    messages,
    writable,
  });
}
```

### Step 3: Create Durable Tools

**Create `/app/workflows/medical-chat/steps/tools.ts`:**
```typescript
import { tool } from "ai";
import { z } from "zod";

async function searchMedicalLiterature({ query }: { query: string }) {
  "use step";
  
  // Search medical databases, papers, etc.
  const results = await fetchMedicalLiterature(query);
  return results;
}

async function getPatientHistory({ patientId }: { patientId: string }) {
  "use step";
  
  // Fetch from database with automatic retry
  const history = await db.query.patientHistory.findFirst({
    where: eq(patients.id, patientId),
  });
  return history;
}

async function suggestDiagnoses({ symptoms }: { symptoms: string[] }) {
  "use step";
  
  // Run diagnostic algorithm
  const suggestions = await runDiagnosticEngine(symptoms);
  return suggestions;
}

export const medicalTools = {
  searchMedicalLiterature: tool({
    description: "Search medical literature and research papers",
    inputSchema: z.object({ query: z.string() }),
    execute: searchMedicalLiterature,
  }),
  getPatientHistory: tool({
    description: "Get patient's medical history",
    inputSchema: z.object({ patientId: z.string() }),
    execute: getPatientHistory,
  }),
  suggestDiagnoses: tool({
    description: "Suggest possible diagnoses based on symptoms",
    inputSchema: z.object({ symptoms: z.array(z.string()) }),
    execute: suggestDiagnoses,
  }),
};
```

**Create `/app/workflows/medical-chat/steps/patient.ts`:**
```typescript
export async function getPatientContext(patientId: string) {
  "use step";
  
  // This step is durable - automatically retried on failure
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, patientId),
    with: {
      conditions: true,
      medications: true,
      allergies: true,
    },
  });
  
  if (!patient) throw new Error(`Patient ${patientId} not found`);
  
  return formatPatientContext(patient);
}
```

### Step 4: Update Chat Route

**Update `/app/api/ai/chat/[patientId]/route.ts`:**
```typescript
import { convertToModelMessages, createUIMessageStreamResponse } from "ai";
import { start } from "workflow/api";
import { medicalChatWorkflow } from "@/app/workflows/medical-chat/route";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  const { messages } = await req.json();
  
  // Convert UI messages to model messages
  const modelMessages = convertToModelMessages(messages);
  
  // Start durable workflow instead of direct streamText
  const run = await start(medicalChatWorkflow, [patientId, modelMessages]);
  
  // Return streaming response from workflow
  return createUIMessageStreamResponse({
    stream: run.readable,
  });
}
```

### Step 5: Enable Resumable Streams (Optional)

For better UX during disconnections, add resumable stream support:

**Create `/app/api/ai/chat/[patientId]/resume/route.ts`:**
```typescript
import { getRun } from "workflow/api";
import { createUIMessageStreamResponse } from "ai";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ patientId: string; runId: string }> }
) {
  const { runId } = await params;
  
  // Resume reading from existing workflow run
  const run = await getRun(runId);
  
  return createUIMessageStreamResponse({
    stream: run.readable,
  });
}
```

### Benefits

- **No timeout limits** - Workflow steps execute durably, bypassing Vercel's 30s limit
- **Automatic retries** - Failed steps retry up to 3 times by default
- **Resumable streams** - Clients can reconnect to interrupted streams
- **Observability** - Full step-by-step tracing via `npx workflow web`
- **Scalable** - Each step runs in separate worker processes
- **Multi-step durability** - Patient data fetch, tool calls, and LLM calls are all durable

### Verification

```bash
# Run workflow observability dashboard
npx workflow web

# Test chat endpoint - should show workflow steps in dashboard
curl -X POST http://localhost:3000/api/ai/chat/patient-123 \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What medications is this patient on?"}]}'
```

---

## Summary

This implementation plan provides:
1. **Fault tolerance** - Retries, fallbacks, and circuit breakers
2. **Latency tolerance** - Workflows bypass timeout limits
3. **Performance** - Redis caching for expensive operations
4. **Flexibility** - Easy provider switching via env vars
5. **Observability** - Full workflow step tracing
6. **Production-ready** - Durable execution with automatic recovery
