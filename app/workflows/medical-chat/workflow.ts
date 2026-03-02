/**
 * Medical Chat Workflow
 *
 * Durable workflow for medical chat operations using Vercel Workflow DevKit.
 * This workflow provides:
 * - Durable execution (no timeout limits)
 * - Automatic retries on failures
 * - Resumable streams for disconnections
 * - Step-by-step observability
 *
 * @example
 * // Start the workflow from an API route
 * const run = await start(medicalChatWorkflow, [patientId, messages]);
 * return createUIMessageStreamResponse({ stream: run.readable });
 */

import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import type { ModelMessage, UIMessageChunk } from "ai";
import { getModel, PRIMARY_PROVIDER, type Provider } from "@/lib/ai/providers";
import { createMedicalTools } from "./steps/tools";
import { getPatientContext } from "./steps/patient";

/**
 * Medical chat workflow function.
 *
 * This function runs as a durable workflow, meaning:
 * - Each step is persisted and can be resumed after failures
 * - No timeout limits (bypasses Vercel's 30s limit)
 * - Automatic retries on transient failures
 * - Full observability via `npx workflow web`
 *
 * @param patientId - The ID of the patient being discussed
 * @param messages - Array of model messages from the conversation
 * @returns void (streams output via writable)
 */
export async function medicalChatWorkflow(
  patientId: string,
  messages: ModelMessage[],
  patientWithAppointments: any
) {
  "use workflow";

  // Get writable stream for agent output
  // This stream is persistent and can be read at any time
  const writable = getWritable<UIMessageChunk>();

  // Step 1: Format patient context (durable step)
  // Patient data is pre-fetched in the route handler (auth context) and passed in.
  const { systemPrompt, patientData, appointments } = await getPatientContext(patientWithAppointments);

  console.log('[Workflow] Patient data loaded:', {
    patientId,
    hasAppointments: appointments?.length > 0,
    appointmentCount: appointments?.length,
    hasBirthdate: !!patientData?.birthdate,
    hasSex: !!patientData?.sex,
  });

  // Get model configuration for the primary provider
  const provider = PRIMARY_PROVIDER;
  const modelConfig = getModel('balanced', provider);
  
  // Extract the primary model name (e.g., "openai/gpt-5-mini")
  // DurableAgent with gateway expects a string model name
  const primaryModel = modelConfig.providerOptions.gateway?.models?.[0] || 
    (provider === 'openai' ? 'openai/gpt-5-mini' : 
     provider === 'anthropic' ? 'anthropic/claude-sonnet-4' : 
     'google/gemini-2.0-flash');

  // Step 2: Create the medical agent with tools
  // The DurableAgent ensures all LLM calls are executed as durable steps
  // Tools marked with "use step" get automatic retries
  const agent = new DurableAgent({
    // Use string model name for gateway
    model: primaryModel,
    system: systemPrompt,
    tools: createMedicalTools({
      appointments,
      birthdate: patientData?.birthdate,
      sex: patientData?.sex,
    }),
  });

  // Step 3: Stream the response
  // This is resumable - if the client disconnects, they can reconnect
  // and continue receiving the stream from where they left off
  console.log('[Workflow] Starting agent stream with', messages.length, 'messages');

  await agent.stream({
    messages,
    writable,
  });

  console.log('[Workflow] Agent stream completed');
}
