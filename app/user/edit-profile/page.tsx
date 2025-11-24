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


const EditProfile = async () => {
  const supabase = await createClient()

  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id

  const doctor = await getDoctor(doctorId)

  return (
    <div>
      <EditDoctor doctor={doctor} />
    </div>
  )
}

export default EditProfile