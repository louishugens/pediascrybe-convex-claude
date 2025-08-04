
import { getPatientWithAppointments } from '@/db/queries';
import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai';


function omitPII<T extends Record<string, any>>(obj: T, keys: string[]): Partial<T> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request, props: { params: Promise<{ patientId: string }>}) {
  const params = await props.params;
  const patientId = params.patientId!
  const patient = await getPatientWithAppointments(patientId);
  const patientWithoutPII = patient ? omitPII(patient, ['firstname', 'lastname', 'email', 'mothername']) : undefined;
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4.1'),
    system: `You are ScrybGPT, a medical assistant chatbot. You are helping a pediatrician\
      understand their patients' conditions. You are given a the patient's profile data and the appointments \
      data, and the pediatrician will ask you question. Answer the questions based on the data provided as context.\
      Follow the following steps:
      1. Understand the question and the patient's data.
      2. If the question is about the patient's data, answer the question based on the data provided.
      3. If the question is not about the patient's data, answer the question based on the general knowledge you have about the medical field.
      4. If the question is about the patient's data, answer the question based on the data provided.
      5. If the question is not about the patient's data, answer the question based on the general knowledge you have about the medical field.
      6. If the question is about the patient's data, answer the question based on the data provided.
      7. Answer the questions in the language of the question. Your interlocutor is a pediatrician and the patient's doctor.\
      Always answer in the language of the question.
      Answer the question based only on the following patient data and appointments data:
      ${JSON.stringify(patientWithoutPII)}
      in addition the general knowledge you have about the medical field.`,
    messages: convertToModelMessages(messages),
    // stopWhen: stepCountIs(5),
    // tools: {
    //   addResource: tool({
    //     description: `add a resource to your knowledge base.
    //       If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
    //     inputSchema: z.object({
    //       content: z
    //         .string()
    //         .describe('the content or resource to add to the knowledge base'),
    //     }),
    //     execute: async ({ content }) => createResource({ content }),
    //   }),
    // },
  });

  return result.toUIMessageStreamResponse();
}