import prisma from "@/utils/prisma";
import { createClient } from '@/utils/supabase/server'


export async function POST(req: Request) {
  if(req.method == 'POST') {
    try {
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
        
        return new Response(JSON.stringify(doctor), {
          status: 200
        });
      }else{
        return new Response(
          JSON.stringify({
         error: { statusCode: 500, message: 'Doctor profile is not update sucessfully' }
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