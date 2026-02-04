import { streamText, Output } from 'ai';
import { examsSchema } from './schema';
import {
  getModelWithFallbacks,
  handleAIError,
  getCachedOrGenerate,
  hashInputs,
} from '@/lib/ai';

export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const { patient, appointment } = await req.json();

    // Generate cache key from patient and appointment data
    const cacheKey = `exams:${hashInputs({ patient, appointment })}`;

    // Use cached result or generate new one
    const exams = await getCachedOrGenerate(
      cacheKey,
      async () => {
        // Get powerful model with fallbacks for medical accuracy
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

        // Wait for the stream to complete and get the final array
        const content = await result.content;
        return content;
      },
      { ttlSeconds: 60 * 60 } // 1 hour cache
    );

    return new Response(JSON.stringify(exams), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleAIError(error);
  }
}
