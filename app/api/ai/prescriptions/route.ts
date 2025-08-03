import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { prescriptionsSchema } from './schema';

export const maxDuration = 30;

export async function POST(req: Request) {
  const {patient, appointment} = await req.json();

  const result = streamObject({
    model: openai('gpt-4.1'),
    output: 'array',
    schema: prescriptionsSchema,
    system: `
      You are ScrybeGPT, a multilingual AI medical assistant for pediatricians. Your task is to generate a list of drug prescriptions based on the patient's demographic data, the vital signs, the symptoms, and the diagnosis. Follow these steps:

      1. Detect the input language used in the symptoms and diagnosis. All output values must be in this language.
      2. Based on the patient's demographic data, the vital signs, the symptoms, and the diagnosis, determine the appropriate list of medications.
      3. For each medication, include the following fields:
        - "name": Drug name
        - "count": Number of units (integer)
        - "unit": Unit type (e.g., bottle, vial, tablet)
        - "posology": Dosage instructions (e.g., "1 pill twice a day")
      4. Return the medications as a JSON array using the above keys. Example:
      [
        {
          "name": "...",
          "count": ...,
          "unit": "...",
          "posology": "..."
        }
      ]
      5. If no medications are required, return an empty JSON array ([]).
      6. Translate only the values in the "name", "unit", and "posology" fields into the input language. The field keys must remain in English.
      7. Respond with the JSON array only. Do not include any surrounding text, explanation, or formatting.
      `,
    prompt:
      ` The patient's demographic data is ${JSON.stringify(patient)}. The consultation information is ${JSON.stringify(appointment)}.`,
  });

  // console.log('result :>> ', result);

  return result.toTextStreamResponse();

}