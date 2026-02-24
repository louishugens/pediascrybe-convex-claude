import { generateText } from 'ai';
import { getModelWithFallbacks, handleAIError } from '@/lib/ai';
import { isAuthenticated } from '@/lib/auth-server';
import { aiRateLimit, checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const maxDuration = 30;

export async function POST(req: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Rate limit
  const ip = await getClientIp();
  const rateLimitResponse = await checkRateLimit(aiRateLimit, ip);
  if (rateLimitResponse) return rateLimitResponse;

  const { prompt } = await req.json();

  // Get powerful model with fallbacks (was gpt-4-1106-preview)
  const { model, providerOptions } = getModelWithFallbacks('powerful');

  try {
    const response = await generateText({
      model,
      providerOptions,
      messages: prompt,
    });

    // Return in similar format to legacy OpenAI response
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: response.text,
              role: 'assistant',
            },
          },
        ],
        usage: response.usage,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return handleAIError(error);
  }
}
