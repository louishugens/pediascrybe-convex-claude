import prisma from "@/utils/prisma"
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from "next/headers";

function getPatients(doctorId){
  const patients = prisma.patient.findMany({
    where:{
      doctorId: doctorId
    },
    orderBy:{
      lastname: 'asc'
    }
  })
  return patients
}


export default async function Page() {
  // const supabase = createServerComponentClient({ cookies})

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
  const patients = await getPatients(doctorId)

  return (
    <div className="flex flex-col w-full">
      <input type="text" className="w-full h-10 border border-gray-300 rounded-md px-4" placeholder="Search" />

    </div>
  )
}
