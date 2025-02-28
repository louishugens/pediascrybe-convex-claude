import { createClient } from '@/utils/supabase/server'


import Stats from "@/components/stats";
import prisma from "@/utils/prisma";

async function getDoctor(doctorId){
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
    include:{
      patients: {
        include:{
          appointments: true,
        },
      },
    },
  })
  return doctor
}




export default async function Dashboard() {

  const supabase = await createClient() 
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id
  // console.log('doctorId :>> ', doctorId);

  const doctor = await getDoctor(doctorId)
  const patients = doctor?.patients

  return (
    <div className=''>
      {doctor && <p className=' font-bold text-slate-900'>
        Hello <span className=' text-green-500'>
          Dr {doctor.firstname} {doctor.lastname}
        </span>
      </p>}
      <Stats patients={patients} />
      
    </div>
  );
}

