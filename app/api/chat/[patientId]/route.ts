import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { AttributeInfo } from "langchain/schema/query_constructor";
// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from 'next/headers';
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { SupabaseTranslator } from "langchain/retrievers/self_query/supabase";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { SupabaseVectorStore, SupabaseFilter } from "langchain/vectorstores/supabase";
import { Document } from "langchain/document";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "langchain/schema/runnable";
import {
  BytesOutputParser,
  StringOutputParser,
} from "langchain/schema/output_parser";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
// import supabase from "@/utils/supabase-rh";
import { createServerClient, type CookieOptions } from '@supabase/ssr'
// import { cookies } from 'next/headers';

export const runtime = "edge";

type ConversationalRetrievalQAChainInput = {
  question: string;
  chat_history: VercelChatMessage[];
};

const combineDocumentsFn = (docs: Document[], separator = "\n\n") => {
  const serializedDocs = docs.map((doc) => doc.pageContent);
  return serializedDocs.join(separator);
};

const formatVercelMessages = (chatHistory: VercelChatMessage[]) => {
  const formattedDialogueTurns = chatHistory.map((message) => {
    if (message.role === "user") {
      return `Human: ${message.content}`;
    } else if (message.role === "assistant") {
      return `Assistant: ${message.content}`;
    } else {
      return `${message.role}: ${message.content}`;
    }
  });
  return formattedDialogueTurns.join("\n");
};

const CONDENSE_QUESTION_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;
const condenseQuestionPrompt = PromptTemplate.fromTemplate(
  CONDENSE_QUESTION_TEMPLATE,
);

const ANSWER_TEMPLATE = `You are ScrybGPT, a medical assistant chatbot. You are helping a pediatrician\
  understand their patients' conditions. You are given a the patient's profile data and the appointments \
  data, and the pediatrician will ask you question. Answer the questions based on the data provided as context.
  Answer the questions in the language of the question. Your chat partner is a pediatrician and the patient's doctor.
  Answer the question based only on the following context:
  {context}
  in addition the general knowledge you have about the medical field.
  Question: {question}
`;
const answerPrompt = PromptTemplate.fromTemplate(ANSWER_TEMPLATE);

const attributeInfo: AttributeInfo[] = [
  {
    name: "patientId",
    description: "The unique identifier for the patient",
    type: "string",
  }
];

const llm = new OpenAI();



/**
 * This handler initializes and calls a retrieval chain. It composes the chain using
 * LangChain Expression Language. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#conversational-retrieval-chain
 */
export async function POST(req: Request, { params }: { params: { patientId: string } }) {

  // const supabase = createRouteHandlerClient({cookies});
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
  const patientId = params.patientId!
  const documentContents = `The documents table contains the patient's profile data and the appointments data. 
  The pageContent column contains either profile or appointment data in stringified JSON format. So we need to parse pageContent to get more granular data.
  The patientId column is used to join the two types of document. The patientId is either in id or patientId 
  field of the pageContent colunm.
  the patientId we are looking for is ${patientId}.`;

  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const previousMessages = messages.slice(0, -1);
    const currentMessageContent = messages[messages.length - 1].content;

    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      // modelName: "gpt-4",
      // modelName: "gpt-4-1106-preview",
      temperature: 0.0,
    });

    // const client = createClient(
    //   process.env.SUPABASE_URL!,
    //   process.env.SUPABASE_PRIVATE_KEY!,
    // );
    const vectorStore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    });

    // const retriever = vectorStore.asRetriever(undefined, {patientId: patientId});

    const selfQueryRetriever = await SelfQueryRetriever.fromLLM({
      llm,
      vectorStore,
      documentContents,
      attributeInfo,
      /**
       * We need to create a basic translator that translates the queries into a
       * filter format that the vector store can understand. We provide a basic translator
       * translator here, but you can create your own translator by extending BaseTranslator
       * abstract class. Note that the vector store needs to support filtering on the metadata
       * attributes you want to query on.
       */
      structuredQueryTranslator: new SupabaseTranslator(),
      searchParams: {
        filter: (rpc: SupabaseFilter) => rpc.filter("metadata->>patientId", "eq", patientId),
        mergeFiltersOperator: "and",
      }
    });



   
    /**
     * We use LangChain Expression Language to compose two chains.
     * To learn more, see the guide here:
     *
     * https://js.langchain.com/docs/guides/expression_language/cookbook
     */
    const standaloneQuestionChain = RunnableSequence.from([
      {
        question: (input: ConversationalRetrievalQAChainInput) =>
          input.question,
        chat_history: (input: ConversationalRetrievalQAChainInput) =>
          formatVercelMessages(input.chat_history),
      },
      condenseQuestionPrompt,
      model,
      new StringOutputParser(),
    ]);

    const answerChain = RunnableSequence.from([
      {
        context: selfQueryRetriever.pipe(combineDocumentsFn),
        question: new RunnablePassthrough(),
      },
      answerPrompt,
      model,
      new BytesOutputParser(),
    ]);

    const conversationalRetrievalQAChain =
      standaloneQuestionChain.pipe(answerChain);

    const stream = await conversationalRetrievalQAChain.stream({
      question: currentMessageContent,
      chat_history: previousMessages,
    });

    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}