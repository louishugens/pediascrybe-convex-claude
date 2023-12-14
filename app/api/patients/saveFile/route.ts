import prisma from "@/utils/prisma";
import { cookies } from 'next/headers';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"
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

    const { url, name, fileType, appointmentId, patientId } = await req.json()

    const file = await prisma.file.create({
      data: {
        url,
        name,
        fileType,
        appointmentId
      }
    })

    

    if (file) {


      // const embeddings = new OpenAIEmbeddings();

      // const store = new SupabaseVectorStore(embeddings, {
      //   client: supabase,
      //   tableName: "documents",
      // });

      // const doc = new Document({ pageContent: JSON.stringify(appointment),
      //   metadata: { patientId: appointment.patientId}});

      // const result = await store.addDocuments([doc]);

      // await prisma.appointment.update({
      //   where:{
      //     id: appointment.id
      //   },
      //   data: {
      //     vectorId: result[0]
      //   }
      // })
      // revalidatePath(`/user/patients/${patientId}/${appointmentId}`)

      console.log('path :>> ', `/user/patients/${patientId}/${appointmentId}`);
      revalidatePath(`/user/patients/${patientId}/${appointmentId}`)
      // revalidatePath(`/user/patients/${patientId}/${appointmentId}/upload-file`);
      
      return new Response(JSON.stringify(file), {
        status: 200
      });
    }else{
      return new Response(
        JSON.stringify({
       error: { statusCode: 500, message: 'file is not saved' }
       }),
       { status: 500 }
     );
    }



  }

}