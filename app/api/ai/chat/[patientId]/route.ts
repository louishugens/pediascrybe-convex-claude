import { convertToModelMessages, createUIMessageStreamResponse, UIMessage } from 'ai';
import { start } from 'workflow/api';
import { medicalChatWorkflow } from '@/app/workflows/medical-chat/workflow';
import { isAuthenticated, fetchAuthQuery, fetchAuthMutation } from '@/lib/auth-server';
import { aiRateLimit, checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request, props: { params: Promise<{ patientId: string }>}) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Rate limit
  const ip = await getClientIp();
  const rateLimitResponse = await checkRateLimit(aiRateLimit, ip);
  if (rateLimitResponse) return rateLimitResponse;

  const params = await props.params;
  const patientId = params.patientId;

  // Fetch patient data here while we still have the auth context.
  // Workflow steps run in a separate durable context with no session, so
  // fetchAuthQuery cannot be called from inside a "use step" function.
  const patientWithAppointments = await fetchAuthQuery(
    api.patients.getPatientWithAppointments,
    { patientId: patientId as Id<"patients"> }
  );

  if (!patientWithAppointments) {
    return new Response(
      JSON.stringify({ error: 'Patient not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Deduct 1 AI credit before running the workflow
  try {
    await fetchAuthMutation(api.usage.deductAICredits, { feature: "patient_chat" });
  } catch (err: any) {
    if (err?.message?.includes("NO_CREDITS")) {
      return new Response(
        JSON.stringify({ error: "Out of AI credits. Buy a credit pack or upgrade your plan." }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }
    throw err;
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  // Convert UI messages to model messages for the workflow
  const modelMessages = await convertToModelMessages(messages);

  try {
    // Start the durable workflow instead of direct streamText
    // This provides automatic retries, resumable streams, and no timeout limits
    const run = await start(medicalChatWorkflow, [patientId, modelMessages, patientWithAppointments]);
    
    // Return the streaming response from the workflow
    return createUIMessageStreamResponse({
      stream: run.readable,
    });
  } catch (error) {
    console.error('[Workflow Chat] Error starting workflow:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Failed to start chat workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
