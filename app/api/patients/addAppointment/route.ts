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

    const { height, weight, head, motif, findings, arm, sao2, temperature, pulse, respiratory, systolic, diastolic, otherRemarks, doctorId, patientId } = await req.json()

    const appointment = await prisma.appointment.create({
      data: {
        height, weight, head, motif, findings, arm, sao2, temperature,  pulse, respiratory, systolic, diastolic, otherRemarks, doctorId, patientId
      }
    })

    
    if (appointment) {
      try {
        const embeddings = new OpenAIEmbeddings();
        const store = new SupabaseVectorStore(embeddings, {
          client: await supabase,
          tableName: "documents",
        });

        const doc = new Document({ 
          pageContent: JSON.stringify(appointment),
          metadata: { patientId: appointment.patientId }
        });

        const result = await store.addDocuments([doc]);

        // Only update vectorId if embedding succeeded
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { vectorId: parseInt(result[0]) }
        });
      } catch (error) {
        // Log the error but don't throw it
        console.error('Failed to create embedding:', error);
      }

      return new Response(JSON.stringify(appointment), {
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