import { streamText } from 'ai';
import { checkBotId } from 'botid/server';
import { isAuthenticated } from '@/lib/auth-server';
import { aiRateLimit, checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getModelWithFallbacks, handleAIError } from '@/lib/ai';

export const maxDuration = 60;

export async function POST(req: Request) {
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

  // Bot protection check
  const verification = await checkBotId();
  if (verification.isBot) {
    return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
  }

  const { prompt }: { prompt: string } = await req.json();

  // Get model with fallbacks and retry middleware
  const { model, providerOptions } = getModelWithFallbacks('balanced');

  try {
    const result = streamText({
      model,
      providerOptions,
      system: `You are ScrybeGPT, a helpful medical assistant specializing in pediatrics.\
        Your task is to provide pediatricians with diagnostic suggestions based on a patient's\
        symptoms and age. Internally follow these steps but NEVER include your reasoning process in the output:\
        \
        1. Identify the language of the symptoms.\
        2. Analyze the vital signs, the symptoms and the patient's demographic data to propose possible diagnoses.\
        3. Formulate diagnostic suggestions based on the analysis.\
        4. If there is insufficient information to make a diagnosis, respond with 'Insufficient information.'\
        5. Respond in the same language as the symptoms.\
        \
        IMPORTANT: Output ONLY the diagnostic suggestions. Do NOT include any intermediate steps, language identification, or reasoning process in your response.`,
      prompt,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return handleAIError(error);
  }
}
