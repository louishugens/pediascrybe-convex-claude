import { streamText } from 'ai';
import { isAuthenticated, fetchAuthMutation } from '@/lib/auth-server';
import { api } from '@/convex/_generated/api';
import { aiRateLimit, checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getModelWithFallbacks, handleAIError } from '@/lib/ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: { statusCode: 401, message: 'Not authenticated' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit
    const ip = await getClientIp();
    const rateLimitResponse = await checkRateLimit(aiRateLimit, ip);
    if (rateLimitResponse) return rateLimitResponse;

    const { messages } = await req.json();

    // Deduct 5 AI credits BEFORE calling the model
    try {
      await fetchAuthMutation(api.usage.deductAICredits, { feature: "report" });
    } catch (err: any) {
      if (err?.message?.includes("NO_CREDITS")) {
        return new Response(
          JSON.stringify({ error: { statusCode: 402, message: "Out of AI credits. Buy a credit pack or upgrade your plan." } }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        );
      }
      throw err;
    }

    // Get fast model with fallbacks for efficiency
    const { model, providerOptions } = getModelWithFallbacks('fast');

    const textStream = streamText({
      model,
      providerOptions,
      messages,
    });

    if (!textStream) {
      return new Response(JSON.stringify(textStream), {
        status: 500,
      });
    }

    return textStream.toTextStreamResponse();
  } catch (error) {
    return handleAIError(error);
  }
}
