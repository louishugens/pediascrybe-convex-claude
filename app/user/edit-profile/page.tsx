import EditDoctor from "@/components/editDoctor"
import prisma from "@/utils/prisma"
import { createClient } from '@/utils/supabase/server'

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
  const supabase = await createClient()

  
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