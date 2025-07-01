import prisma from "@/utils/prisma";
import { revalidateTag } from "next/cache";
import { utapi } from "uploadthing/server";
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

    const { file } = await req.json()

     const deletedFile = await prisma.file.delete({
      where:{
        id: file.id
      }
    })

    const utId = file.url.split("/").pop()

    await utapi.deleteFiles(utId)

    

    if (deletedFile) {

      revalidateTag("file")
      return new Response("Delete sucessfull", {
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