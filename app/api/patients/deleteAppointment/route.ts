import prisma from "@/utils/prisma";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  if(req.method == 'POST') {

    const supabase = await createClient()

    const { data: {session}, error } = await (await supabase).auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'Session is not defined' }
        }),
        { status: 500 }
      );
    }

    const { appointmentId } = await req.json()

     const deletedFile  = await prisma.appointment.delete({
      where:{
        id: appointmentId
      },
    })

    if (deletedFile) {

      revalidateTag("appointments")
      return new NextResponse("Delete sucessfull", {
        status: 200
      });
    }else{
      return new NextResponse(
        JSON.stringify({
       error: { statusCode: 500, message: 'Appointment not deleted' }
       }),
       { status: 500 }
     );
    }

  }

}