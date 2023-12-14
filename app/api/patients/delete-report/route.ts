import prisma from "@/utils/prisma";
import { cookies } from 'next/headers';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
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

    const { reportId } = await req.json()

     const deletedFile = await prisma.report.delete({
      where:{
        id: reportId
      }
    })

    if (deletedFile) {

      revalidateTag("reports")
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