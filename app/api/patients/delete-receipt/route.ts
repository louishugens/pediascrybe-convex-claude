import prisma from "@/utils/prisma";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
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

    const { receiptId } = await req.json()

     const deletedFile = await prisma.receipt.delete({
      where:{
        id: receiptId
      }
    })

    if (deletedFile) {

      revalidateTag("receipts", "max")
      return new NextResponse("Delete sucessfull", {
        status: 200
      });
    }else{
      return new NextResponse(
        JSON.stringify({
       error: { statusCode: 500, message: 'file is not saved' }
       }),
       { status: 500 }
     );
    }

  }

}