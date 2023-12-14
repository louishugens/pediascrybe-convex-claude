import prisma from "@/utils/prisma";
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { revalidatePath } from "next/cache";

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

    const { firstname, lastname, email, phone, spec, address, id} = await req.json()

    const doctor = await prisma.doctor.update({
      where:{
        id: id
      },
      data: {
        firstname, lastname, email, phone, spec, address
      }
    })

    
    if (doctor) {

      // revalidatePath(`/user/profile`)
      // revalidatePath(`/user/edit-profile`)
      
      return new Response(JSON.stringify(doctor), {
        status: 200
      });
      // return NextResponse.redirect(`/patients/${patientId}/appointments/${appointment.id}`)
    }else{
      return new Response(
        JSON.stringify({
       error: { statusCode: 500, message: 'Doctor profile is not update sucessfully' }
       }),
       { status: 500 }
     );
     
    }

  }

}