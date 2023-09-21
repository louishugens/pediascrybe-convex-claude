import prisma from "@/utils/prisma";
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { revalidateTag } from "next/cache";
import { utapi } from "uploadthing/server";
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