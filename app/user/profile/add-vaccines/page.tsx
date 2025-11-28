import { db } from '@/db'
import { Doctor, Vaccin, VaccinReference } from '@/db/schema'
import UpdateDoctorVaccines from '@/components/updateDoctorVaccines'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Suspense, ViewTransition } from 'react'
import GenericFormSkeleton from '@/components/skeletons/generic-form-skeleton'
import { eq } from 'drizzle-orm'

export default async function AddVaccines() {


  return (
    <div className='h-screen mb-8 pb-4 overflow-y-auto '>
      <ViewTransition>
        <Suspense fallback={<GenericFormSkeleton />}>
          <AddVaccinesContainer />
        </Suspense>
      </ViewTransition>
    </div>
  )
}

async function AddVaccinesContainer() {

  const supabase = await createClient()


  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id
  if (!doctorId) {
    redirect('/')
  }

  const referenceVaccines = await db.query.VaccinReference.findMany(
    {
      with: {
        doses: true
      }
    }
  )

  const doctorVaccines = await db.query.Vaccin.findMany(
    {
      where: eq(Vaccin.doctorId, doctorId),
      with: {
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