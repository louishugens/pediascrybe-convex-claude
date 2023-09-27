import prisma from "@/utils/prisma";
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if(req.method == 'POST') {

    const supabase = createRouteHandlerClient({cookies});
    const { data: {session}, error } = await supabase.auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'Session is not defined' }
        }),
        { status: 500 }
      );
    }

    const {patient} = await req.json()

    // console.log('patient :>> ', patient);

    if (patient) {

      const embeddings = new OpenAIEmbeddings();

      const store = new SupabaseVectorStore(embeddings, {
        client: supabase,
        tableName: "documents",
      });

      if(patient.vectorId){
        await store.delete({ids:[patient.vectorId]});
      }

      const doc = new Document({ pageContent: JSON.stringify(patient),
        metadata: { patientId: patient.id}});


      const result = await store.addDocuments([doc]);

      await prisma.patient.update({
        where:{
          id: patient.id
        },
        data: {
          vectorId: parseInt(result[0])
        }
      })

      return new Response(JSON.stringify(patient), {
        status: 200
      });
    }else{
      return new Response(
        JSON.stringify({
       error: { statusCode: 500, message: 'appointment is not update sucessfully adding exams' }
       }),
       { status: 500 }
     );
    }

  }

}