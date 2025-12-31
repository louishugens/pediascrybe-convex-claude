import { VaccineRecordsTable } from '@/components/vaccineRecordsTable'
import VaccinesSkeleton from '@/components/skeletons/vaccines-skeleton'
import Link from 'next/link'
import { ArrowUturnLeftIcon, PlusIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { Suspense, ViewTransition } from 'react'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

export default async function Page(props: { params: Promise<{ patientId: string }> }) {
  return (
    <div className='h-full mb-8 mt-4'>
      <ViewTransition>
        <Suspense fallback={<VaccinesSkeleton />}>
          <VaccineRecordsTableContainer params={props.params} />
        </Suspense>
      </ViewTransition>
    </div>
  )
}

async function VaccineRecordsTableContainer(props: { params: Promise<{ patientId: string }> }) {
  const params = await props.params;
  const vaccineRecords = await fetchAuthQuery(api.vaccines.getPatientVaccineRecords, { 
    patientId: params.patientId as Id<"patients"> 
  })
  
  return (
    <div className='flex flex-col gap-4 w-full h-fit bg-slate-50 rounded-lg p-4'>
      <div className='flex flex-row justify-between'>
        <h1 className='font-bold'>Vaccine Records</h1>
        <div className='flex flex-row gap-2'>
          <Link href={`/user/patients/${params.patientId}`} className=' text-black'>
            <ArrowUturnLeftIcon className='w-4 h-4' />
          </Link>
          <Link href={`/user/patients/${params.patientId}/vaccines/add-record`} className='text-black'>
            <PlusIcon className='w-4 h-4' />
          </Link>
          {
            vaccineRecords.length > 0 && (
              <Link href={`/user/patients/${params.patientId}/vaccines/print`} className='text-black'>
                <PrinterIcon className='w-4 h-4' />
              </Link>
            )
          }
        </div>
      </div>
      <div className=''>
        {
          vaccineRecords.length > 0 ? (
            <VaccineRecordsTable records={vaccineRecords} />
          ) : (
            <p className='text-sm text-muted-foreground'>No vaccine records found for this patient</p>
          )
        }
      </div>
    </div>
  )
}
