import { streamText, Output } from 'ai';
import { examsSchema } from './schema';
import {
  getModelWithFallbacks,
  handleAIError,
  hashInputs,
} from '@/lib/ai';
import { isAuthenticated } from '@/lib/auth-server';
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

    const cacheKey = `ai:v2:exams:${hashInputs({ patient, appointment })}`;

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

    const { model, providerOptions } = getModelWithFallbacks('powerful');

    const result = streamText({
      model,
      providerOptions,
      output: Output.array({
        element: examsSchema,
      }),
      system: `As ScrybeGPT, a helpful medical assistant, your task is to propose to a pediatrician a list of lab exams for a patient, based on their demographic data and the record information. Follow these steps:\
          1. Identify the language used for the symptoms.\
          2. Based on the demographic data, the vital signs, the symptoms, and the diagnosis, determine an appropriate set of lab exams that should be conducted.\
          3. If no lab exams are necessary, send an empty JSON array.\
          4. Ensure the JSON array is formatted correctly and contains only the required information.\
          5. Translate the values for each key in the JSON array into the language used for the symptoms.\
          6. Respond with the output in the same language as the symptoms and diagnostics.`,
      prompt: `The patient's demographic data is ${JSON.stringify(patient)}. The record information is ${JSON.stringify(appointment)}.`,
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
