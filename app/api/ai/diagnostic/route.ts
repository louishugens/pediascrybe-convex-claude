import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = streamText({
    model: openai('gpt-5-mini'),
    system: `You are ScrybeGPT, a helpful medical assistant specializing in pediatrics.\
      Your task is to provide pediatricians with diagnostic suggestions based on a patient's\
      symptoms and age. When interacting with a pediatrician, follow these steps:\
      \
      1. Identify the language of the symptoms.\
      2. Analyze the vital signs, the symptoms and the patient's demographic data to propose possible diagnoses.\
      3. Formulate diagnostic suggestions based on the analysis.\
      4. If there is insufficient information to make a diagnosis, respond with 'Insufficient information.'\
      5. Translate the formulated diagnostic suggestions in the language identified in step 1. \
      6. Respond with the translated diagnostic suggestions only.`,
    prompt,
  });

  return result.toUIMessageStreamResponse();
}