import prisma from "@/utils/prisma";
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

    const {reportType, content, patientId, id}= await req.json()

    const report = await prisma.report.update({
      where:{
        id: id
      },
      data: {
        reportType, content, patientId, createdAt: new Date()
      }
    })


    if (report) {

      return NextResponse.json(report);
    }else{
      return new NextResponse(
        JSON.stringify({
       error: { statusCode: 500, message: 'report is not successfully created' }
       }),
       { status: 500 }
     );
    }

  }

}