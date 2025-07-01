import prisma from "@/utils/prisma";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  if(req.method == 'POST') {

    const supabase = await createClient()

    const { data: {user}, error } = await (await supabase).auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'User is not defined' }
        }),
        { status: 500 }
      );
    }

    const {medication, appointmentId}= await req.json()

    const appointment = await prisma.appointment.update({
      where:{
        id: appointmentId
      },
      data: {
        medication
      }
    })


    if (appointment) {

      const embeddings = new OpenAIEmbeddings();

      const store = new SupabaseVectorStore(embeddings, {
        client: await supabase,
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
      
      // revalidatePath(`/user/patients/${appointment.patientId}/${appointment.id}`);
      // revalidatePath(`/user/patients/${appointment.patientId}/${appointment.id}/add-prescription`);

      return new Response(JSON.stringify(appointment), {
        status: 200
      });
    }else{
      return new Response(
        JSON.stringify({
       error: { statusCode: 500, message: 'appointment is not update successfully adding prescriptions' }
       }),
       { status: 500 }
     );
    }

  }

}