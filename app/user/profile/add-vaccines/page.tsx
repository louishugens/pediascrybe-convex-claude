import prisma from '@/utils/prisma'
import UpdateDoctorVaccines from '@/components/updateDoctorVaccines'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function AddVaccines() {
  const supabase = await createClient()

    
    const {
      data: { session },
    } = await supabase.auth.getSession()
  
    const doctorId = session?.user?.id
    if(!doctorId){
      redirect('/login')
    }

    const referenceVaccines = await prisma.vaccinReference.findMany(
      {
        include:{
          doses: true
        }
      }
    )

    const doctorVaccines = await prisma.vaccin.findMany(
      {
        where:{
          doctorId: doctorId
        },
        include:{
          doses: true
        }
      }
    )
    
  return (
    <div className='h-screen mb-8 pb-4 overflow-y-auto '>
      <UpdateDoctorVaccines doctorVaccines={doctorVaccines} referenceVaccines={referenceVaccines} doctorId={doctorId} />
    </div>
  )
}
