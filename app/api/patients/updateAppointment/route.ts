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

    const {height, weight, head, motif, findings, otherRemarks, arm, sao2, temperature, pulse, respiratory, systolic, diastolic, appointmentId}  = await req.json()

    const appointment = await prisma.appointment.update({
      where:{
        id: appointmentId
      },
      data: {
        height, weight, head, motif, findings, otherRemarks, arm, sao2, temperature, pulse, respiratory, systolic, diastolic
      }
    })

    

    if (appointment) {

      const embeddings = new OpenAIEmbeddings();

      const store = new SupabaseVectorStore(embeddings, {
        client: supabase,
        tableName: "documents",
      });

      if(appointment.vectorId){
        await store.delete({ids:[appointment.vectorId.toString()]});
      }

      const doc = new Document({ pageContent: JSON.stringify(appointment),
        metadata: { patientId: appointment.patientId}});

      const result = await store.addDocuments([doc]);

      await prisma.appointment.update({
        where:{
          id: appointment.id
        },
        data: {
          vectorId: parseInt(result[0])
        }
      })

      console.log('path :>> ', `/user/patients/${appointment.patientId}/${appointment.id}/edit-appointment`);

      // revalidatePath(`/user/patients/${appointment.patientId}/`)
      // revalidatePath(`/user/patients/${appointment.patientId}/${appointment.id}`)
      // revalidatePath(`/user/patients/${appointment.patientId}/${appointment.id}/edit-appointment`)

      return new Response(JSON.stringify(appointment), {
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