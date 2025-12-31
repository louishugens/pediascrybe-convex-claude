import UpdateDoctorVaccines from '@/components/updateDoctorVaccines'
import { redirect } from 'next/navigation'
import { Suspense, ViewTransition } from 'react'
import GenericFormSkeleton from '@/components/skeletons/generic-form-skeleton'
import { getCurrentDoctor } from '@/lib/convex-data'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

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
  const doctor = await getCurrentDoctor()
  
  if (!doctor) {
    redirect('/')
  }

  const [referenceVaccines, doctorVaccines] = await Promise.all([
    fetchAuthQuery(api.vaccines.getVaccineReferences, {}),
    fetchAuthQuery(api.vaccines.getDoctorTrackedVaccines, { doctorId: doctor._id }),
  ])

  return (
    <div className='h-screen mb-8 pb-4 overflow-y-auto '>
      <UpdateDoctorVaccines 
        doctorVaccines={doctorVaccines} 
        referenceVaccines={referenceVaccines} 
        doctorId={doctor._id} 
      />
    </div>
  )
}
