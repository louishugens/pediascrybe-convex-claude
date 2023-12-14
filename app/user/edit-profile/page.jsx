import EditDoctor from "@/components/editDoctor"
import prisma from "@/utils/prisma"
// import {createServerClient} from '@/utils/supabase-server'
import supabase from '@/utils/supabase-ssr'

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