import { generateText } from 'ai';
import { getModelWithFallbacks, handleAIError } from '@/lib/ai';

export const maxDuration = 30;

export async function POST(req: Request) {
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
