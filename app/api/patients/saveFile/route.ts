import prisma from "@/utils/prisma";
import { revalidatePath } from "next/cache";
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

    const { url, name, fileType, appointmentId, patientId } = await req.json()

    const file = await prisma.file.create({
      data: {
        url,
        name,
        fileType,
        appointmentId
      }
    })

    

    if (file) {

      console.log('path :>> ', `/user/patients/${patientId}/${appointmentId}`);
      revalidatePath(`/user/patients/${patientId}/${appointmentId}`)
      
      return new Response(JSON.stringify(file), {
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