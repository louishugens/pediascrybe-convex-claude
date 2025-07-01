import prisma from "@/utils/prisma";
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

    const {reportType, content, patientId}= await req.json()

    const report = await prisma.report.create({
      data: {
        reportType, content, patientId
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