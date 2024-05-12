import prisma from "@/utils/prisma";
import { cookies } from 'next/headers';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
// import supabase from "@/utils/supabase-rh";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function POST(req: Request) {
  if(req.method == 'POST') {

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
    
    const { data: {session}, error } = await supabase.auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'Session is not defined' }
        }),
        { status: 500 }
      );
    }

    const { firstname, lastname, email, birthdate, mothername, sex, religion, phone, id, allergies, history, bloodtype, electrophoresis } = await req.json()

    const patient  =   await prisma.patient.update({
      where:{
        id: id
      },
      data: {
        firstname, lastname, email, birthdate, mothername, sex, religion, phone, allergies, history, bloodtype, electrophoresis
      }
    })

    

    if (patient) {


      const embeddings = new OpenAIEmbeddings();

      const store = new SupabaseVectorStore(embeddings, {
        client: supabase,
        tableName: "documents",
      });

      if(patient.vectorId){
        await store.delete({ids:[patient.vectorId.toString()]});
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

      // revalidatePath(`/user/patients/${patient.id}/`, 'layout')
      // revalidatePath(`/user/patients/${patient.id}/edit-patient`)

      return new Response(JSON.stringify(patient), {
        status: 200
      });
    }else{
      return new Response(
        JSON.stringify({
       error: { statusCode: 500, message: 'article is not created' }
       }),
       { status: 500 }
     );
    }


  }

}