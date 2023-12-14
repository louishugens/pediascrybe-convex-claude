import EditDoctor from "@/components/editDoctor"
import prisma from "@/utils/prisma"
// import {createServerClient} from '@/utils/supabase-server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from "next/headers";

async function getDoctor(doctorId){
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
  })
  return doctor
}

export const dynamic = 'force-dynamic';

const EditProfile = async () => {
  // const supabase = createServerClient()

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id

  const doctor = await getDoctor(doctorId)

  return (
    <div>
      <EditDoctor doctor={doctor} />
    </div>
  )
}

export default EditProfile