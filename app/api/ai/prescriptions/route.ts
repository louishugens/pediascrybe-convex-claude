import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { prescriptionsSchema } from './schema';

export const maxDuration = 30;

export async function POST(req: Request) {
  const {patient, symptoms, diagnosis} = await req.json();

  const result = streamObject({
    model: openai('gpt-4.1'),
    output: 'array',
    schema: prescriptionsSchema,
    // system:       `As ScrybeGPT, a helpful medical assidtant, your task is to propose to pediatrician a list of drug prescriptions \
    // for a patient, based on their symptoms and diagnostics. Follow these steps:\
    // 1. Identify the language used for the symptoms.\
    // 2. Based on the age, symptoms, and diagnosis, determine appropriate list medications.\
    // 3. For each medication, decide the quantity (count), unit (e.g., flacon, bottle, vial), and posology (e.g., '1 pill twice a day').\
    // 4. Compile the medications into a JSON array. Each entry should include the drug name, count, unit, and posology.\
    // 5. If no medications are necessary, send an empty JSON array.\
    // 6. Translate the values for each key in the JSON array into the language used for the symptoms.\
    // \
    // Provide the output in the same language as the symptoms and diagnostics. Only send the JSON array as the response.`,
    system: `
      You are ScrybeGPT, a multilingual AI medical assistant for pediatricians. Your task is to generate a list of drug prescriptions based on the patient's symptoms, age, and diagnosis. Follow these steps:

      1. Detect the input language used in the symptoms and diagnosis. All output values must be in this language.
      2. Based on the patient's age, symptoms, and diagnosis, determine the appropriate list of medications.
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
      ` The patient's information is ${JSON.stringify(patient)}. The symptoms are <<<${symptoms}>>> and the diagnosis is <<<${diagnosis}>>>.`,
  });

  // console.log('result :>> ', result);

  return result.toTextStreamResponse();

}