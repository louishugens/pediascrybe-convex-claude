import { streamText, Output } from 'ai';
import { prescriptionsSchema } from './schema';
import {
  getModelWithFallbacks,
  handleAIError,
  hashInputs,
} from '@/lib/ai';
import { isAuthenticated, fetchAuthMutation } from '@/lib/auth-server';
import { api } from '@/convex/_generated/api';
import { aiRateLimit, checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const maxDuration = 45;

/** Collect a ReadableStream into a string */
async function collectStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text;
}

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

    const { patient, appointment } = await req.json();

    const cacheKey = `ai:v2:prescriptions:${hashInputs({ patient, appointment })}`;

    // Check cache first — cached value is the raw JSON text the model produced
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached !== null) {
        console.log(`[AI Cache] Hit`);
        return new Response(typeof cached === 'string' ? cached : JSON.stringify(cached), {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    } catch (error) {
      console.warn(`[AI Cache] Read error:`, error);
    }

    console.log(`[AI Cache] Miss`);

    // Deduct 2 AI credits (cache hits already returned above — no charge)
    try {
      await fetchAuthMutation(api.usage.deductAICredits, { feature: "prescription" });
    } catch (err: any) {
      if (err?.message?.includes("NO_CREDITS")) {
        return new Response(
          JSON.stringify({ error: { statusCode: 402, message: "Out of AI credits. Buy a credit pack or upgrade your plan." } }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        );
      }
      throw err;
    }

    const { model, providerOptions } = getModelWithFallbacks('balanced');

    const result = streamText({
      model,
      providerOptions,
      output: Output.array({
        element: prescriptionsSchema,
      }),
      system: `
        You are ScrybeGPT, a multilingual AI medical assistant for pediatricians. Your task is to generate a list of drug prescriptions based on the patient's demographic data, the vital signs, the symptoms, and the diagnosis. Follow these steps:

        1. Detect the input language used in the symptoms and diagnosis. All output values must be in this language.
        2. Based on the patient's demographic data, the vital signs, the symptoms, and the diagnosis, determine the appropriate list of medications.
        3. For each medication, include the following fields:
          - "drug": Drug name
          - "count": Number of units (integer)
          - "unit": Unit type (e.g., bottle, vial, tablet)
          - "posology": Dosage instructions (e.g., "1 pill twice a day")
        4. Return the medications as a JSON array using the above keys.
        5. If no medications are required, return an empty JSON array ([]).
        6. Translate only the values in the "drug", "unit", and "posology" fields into the input language. The field keys must remain in English.
        7. Respond with the JSON array only. Do not include any surrounding text, explanation, or formatting.
        `,
      prompt: ` The patient's demographic data is ${JSON.stringify(patient)}. The record information is ${JSON.stringify(appointment)}.`,
    });

    // Get the text stream response
    const response = result.toTextStreamResponse();

    // Tee the stream: one copy for the client, one for caching
    const [clientStream, cacheStream] = response.body!.tee();

    // Collect the cache copy in the background and store the raw text
    collectStream(cacheStream).then(async (text) => {
      try {
        await redis.set(cacheKey, text, { ex: 3600 });
        console.log(`[AI Cache] Stored (TTL: 3600s)`);
      } catch (error) {
        console.warn(`[AI Cache] Write error:`, error);
      }
    }).catch(() => {});

    // Stream to client
    return new Response(clientStream, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    return handleAIError(error);
  }
}
