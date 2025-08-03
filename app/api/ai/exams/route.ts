import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { examsSchema } from './schema';

export const maxDuration = 30;

export async function POST(req: Request) {
  const {patient, appointment} = await req.json();

  const result = streamObject({
    model: openai('gpt-4.1'),
    output: 'array',
    schema: examsSchema,
    system: `As ScrybeGPT, a helpful medical assistant, your task is to propose to a pediatrician a list of lab exams for a patient, based on their demographic data and the consultation information. Follow these steps:\
        1. Identify the laguage used for the symptoms.\
        2. Based on the demographic data, the vital signs, the symptoms, and the diagnosis, determine an appropriate set of lab exams that should be conducted.\
        3. If no lab exams are necessary, send an empty JSON array.\
        4. Ensure the JSON array is formatted correctly and contains only the required information.\
        5. Translate the values for each key in the JSON array into the language used for the symptoms.\
        6. Respond with the output in the same language as the symptoms and diagnostics.`,
    prompt: `The patient's demographic data is ${JSON.stringify(patient)}. The consultation information is ${JSON.stringify(appointment)}.`,
  });

  return result.toTextStreamResponse();

}