

import EditVaccinationRecordForm from '@/components/editVaccinationRecordForm'
import { getVaccinationRecord } from '@/data/queries'
import Link from 'next/link'
import { Dose, Vaccin, VaccinationRecord } from '@prisma/client'
import { redirect } from 'next/navigation'

export default async function Page(props: { params: Promise<{ patientId: string, recordId: string }> }) {
  const params = await props.params;

  const vaccinationRecord: VaccinationRecord & { vaccin: Vaccin, dose: Dose } | null = await getVaccinationRecord(params.recordId)

  if (!vaccinationRecord) {
    redirect('/user/patients/' + params.patientId + '/vaccines')
  }

  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-col gap-4 w-full h-fit bg-slate-50 rounded-lg p-4'>
        <h1 className='font-bold'>Editing a record of {vaccinationRecord.vaccin.name}</h1>
        <EditVaccinationRecordForm vaccinationRecord={vaccinationRecord} />
      </div>
    </div>
  )
}
