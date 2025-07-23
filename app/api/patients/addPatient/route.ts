import prisma from "@/utils/prisma";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  if(req.method == 'POST') {
    try {
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

      const { firstname, lastname, email, birthdate, mothername, sex, religion, phone, id, allergies, history, bloodtype, electrophoresis } = await req.json()

      const patient  =   await prisma.patient.create({
        data: {
              firstname, lastname, email, birthdate, religion, sex, mothername, phone, allergies, history, bloodtype, electrophoresis, doctorId: id
            }
      })

      

      if (patient) {


        // const embeddings = new OpenAIEmbeddings();

        // const store = new SupabaseVectorStore(embeddings, {
        //   client: await supabase,
        //   tableName: "documents",
        // });

        // const doc = new Document({ pageContent: JSON.stringify(patient),
        //   metadata: { patientId: patient.id}});

        // const result = await store.addDocuments([doc]);

        // await prisma.patient.update({
        //   where:{
        //     id: patient.id
        //   },
        //   data: {
        //     vectorId: parseInt(result[0])
        //   }
        // })

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
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'An error occurred' }
        }),
        { status: 500 }
      );
    }
  }
}