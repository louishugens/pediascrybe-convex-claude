import { streamText, Output } from 'ai';
import { prescriptionsSchema } from './schema';
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
    const cacheKey = `prescriptions:${hashInputs({ patient, appointment })}`;

    // Use cached result or generate new one
    const prescriptions = await getCachedOrGenerate(
      cacheKey,
      async () => {
        // Get balanced model with fallbacks
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

        // Wait for the stream to complete and get the final array
        const content = await result.content;
        return content;
      },
      { ttlSeconds: 60 * 60 } // 1 hour cache
    );

    return new Response(JSON.stringify(prescriptions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleAIError(error);
  }
}
