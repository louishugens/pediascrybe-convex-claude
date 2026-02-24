import { generateText } from 'ai';
import { getModelWithFallbacks, handleAIError } from '@/lib/ai';
import { isAuthenticated } from '@/lib/auth-server';

export const maxDuration = 30;

export async function POST(req: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { messages } = await req.json();

  // Get powerful model with fallbacks (was gpt-4.1)
  const { model, providerOptions } = getModelWithFallbacks('powerful');

  try {
    const response = await generateText({
      model,
      providerOptions,
      messages,
    });

    if (!response) {
      return new Response(JSON.stringify(response), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(response.text), {
      status: 200,
    });
  } catch (error) {
    return handleAIError(error);
  }
}
