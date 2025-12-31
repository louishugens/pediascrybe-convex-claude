import EditVaccinationRecordForm from '@/components/editVaccinationRecordForm'
import VaccineFormSkeleton from '@/components/skeletons/vaccine-form-skeleton'
import Link from 'next/link'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { redirect } from 'next/navigation'
import { Suspense, ViewTransition } from 'react'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

export default async function Page(props: { params: Promise<{ patientId: string, recordId: string }> }) {
  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-col gap-4 w-full h-fit bg-slate-50 rounded-lg p-4'>
        <ViewTransition>
          <Suspense fallback={<VaccineFormSkeleton />}>
            <VaccinationRecordContainer params={props.params} />
          </Suspense>
        </ViewTransition>
      </div>
    </div>
  )
}

async function VaccinationRecordContainer(props: { params: Promise<{ patientId: string, recordId: string }> }) {
  const params = await props.params;

  const vaccinationRecord = await fetchAuthQuery(api.vaccines.getVaccinationRecord, { 
    recordId: params.recordId as Id<"vaccinationRecords"> 
  });

  if (!vaccinationRecord) {
    redirect(('/user/patients/' + params.patientId + '/vaccines') as any)
  }

  return (
    <div>
      <div className='flex flex-row justify-between items-center'>
        <h1 className='font-bold'>Editing a record of {vaccinationRecord.vaccin?.name}</h1>
        <Link href={`/user/patients/${params.patientId}/vaccines`} className='text-black bg-white p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors'>
          <ArrowUturnLeftIcon className='w-4 h-4' />
        </Link>
      </div>
      <EditVaccinationRecordForm vaccinationRecord={vaccinationRecord} />
    </div>
  )
}
