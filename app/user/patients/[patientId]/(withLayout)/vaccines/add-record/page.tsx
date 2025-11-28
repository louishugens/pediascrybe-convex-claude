
import AddVaccineForm from '@/components/addVaccineForm'
import VaccineFormSkeleton from '@/components/skeletons/vaccine-form-skeleton'
import { getDoctorTrackedVaccines } from '@/data/queries'
import Link from 'next/link'
import { Suspense, ViewTransition } from 'react'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline'

export default async function Page(props: { params: Promise<{ patientId: string }> }) {
  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-col gap-4 w-full h-fit bg-slate-50 rounded-lg p-4'>
        <ViewTransition>
          <Suspense fallback={<VaccineFormSkeleton />}>
            <AddVaccineFormContainer params={props.params} />
          </Suspense>
        </ViewTransition>
      </div>
    </div>
  )
}

async function AddVaccineFormContainer(props: { params: Promise<{ patientId: string }> }) {
  const params = await props.params;
  const trackedVaccines = await getDoctorTrackedVaccines()
  return (
    <>
      <div className='flex flex-row justify-between items-center'>
        <h1 className='font-bold'>Add Vaccine Record</h1>
        <Link href={`/user/patients/${params.patientId}/vaccines`} className='text-black bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors'>
          <ArrowUturnLeftIcon className='w-4 h-4' />
        </Link>
      </div>
      {
        trackedVaccines && trackedVaccines.length > 0 ? (
          <AddVaccineForm vaccines={trackedVaccines} patientId={params.patientId} />
        ) : (
          <p className='text-sm text-muted-foreground'>No tracked vaccines found. Please click <Link href='/user/profile/add-vaccines' className='text-blue-500'>here</Link> to add tracked vaccines.</p>
        )
      }
    </>
  );
}