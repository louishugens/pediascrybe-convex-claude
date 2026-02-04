import { VaccineRecordsTable } from '@/components/vaccineRecordsTable'
import VaccinesSkeleton from '@/components/skeletons/vaccines-skeleton'
import VaccineTrackingDashboard from '@/components/patient/vaccine-tracking-dashboard'
import Link from 'next/link'
import { ArrowUturnLeftIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { Suspense, ViewTransition } from 'react'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

export default async function Page(props: { params: Promise<{ patientId: string }> }) {
  return (
    <div className='h-full mb-8 mt-4 space-y-6'>
      <ViewTransition>
        <Suspense fallback={<VaccinesSkeleton />}>
          <VaccinesPageContent params={props.params} />
        </Suspense>
      </ViewTransition>
    </div>
  )
}

async function VaccinesPageContent(props: { params: Promise<{ patientId: string }> }) {
  const params = await props.params;

  const [complianceData, vaccineRecords] = await Promise.all([
    fetchAuthQuery(api.vaccines.getPatientVaccineCompliance, {
      patientId: params.patientId as Id<"patients">
    }),
    fetchAuthQuery(api.vaccines.getPatientVaccineRecords, {
      patientId: params.patientId as Id<"patients">
    }),
  ]);

  return (
    <>
      {/* Vaccination Tracking Dashboard */}
      <VaccineTrackingDashboard
        patientId={params.patientId}
        birthdate={complianceData.patient.birthdate}
        vaccines={complianceData.vaccines}
        records={complianceData.records}
      />

      {/* Vaccination Records History */}
      <div className='flex flex-col gap-4 w-full h-fit rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 shadow-sm'>
        <div className='flex flex-row justify-between items-center'>
          <h2 className='text-sm font-semibold text-foreground'>Vaccination History</h2>
          <div className='flex flex-row gap-2'>
            <Link href={`/user/patients/${params.patientId}`} className='text-muted-foreground hover:text-foreground transition-colors'>
              <ArrowUturnLeftIcon className='w-4 h-4' />
            </Link>
            {vaccineRecords.length > 0 && (
              <Link href={`/user/patients/${params.patientId}/vaccines/print`} className='text-muted-foreground hover:text-foreground transition-colors'>
                <PrinterIcon className='w-4 h-4' />
              </Link>
            )}
          </div>
        </div>
        <div>
          {vaccineRecords.length > 0 ? (
            <VaccineRecordsTable records={vaccineRecords} />
          ) : (
            <p className='text-sm text-muted-foreground'>No vaccine records found for this patient</p>
          )}
        </div>
      </div>
    </>
  )
}
