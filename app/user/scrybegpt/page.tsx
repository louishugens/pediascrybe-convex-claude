import prisma from "@/utils/prisma"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

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
  const supabase = createServerComponentClient({ cookies})
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
