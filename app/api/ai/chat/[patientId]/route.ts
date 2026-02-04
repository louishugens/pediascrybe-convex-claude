import { convertToModelMessages, createUIMessageStreamResponse, UIMessage } from 'ai';
import { start } from 'workflow/api';
import { medicalChatWorkflow } from '@/app/workflows/medical-chat/workflow';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

/**
 * Medical Chat API Route using Vercel Workflow
 *
 * This route uses a durable workflow for the chat functionality, providing:
 * - No timeout limits (workflow steps are durable)
 * - Automatic retries on failures
 * - Resumable streams for disconnections
 * - Full observability via `npx workflow web`
 *
 * The workflow:
 * 1. Fetches patient context (durable step with retries)
 * 2. Creates a DurableAgent with medical tools
 * 3. Streams the response (resumable)
 */
export async function POST(req: Request, props: { params: Promise<{ patientId: string }>}) {
  const params = await props.params;
  const patientId = params.patientId;
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  // Convert UI messages to model messages for the workflow
  const modelMessages = await convertToModelMessages(messages);
  
  try {
    // Start the durable workflow instead of direct streamText
    // This provides automatic retries, resumable streams, and no timeout limits
    const run = await start(medicalChatWorkflow, [patientId, modelMessages]);
    
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
