
import { VaccineRecordsTable } from '@/components/vaccineRecordsTable'
import { getPatientVaccineRecords } from '@/data/queries'
import Link from 'next/link'
import { VaccinationRecord, Dose, Vaccin } from '@prisma/client'

type VaccineRecordWithDetails = VaccinationRecord & {
  vaccin: Vaccin;
  dose: Dose;
}
export default async function Page({ params }: { params: { patientId: string } }) {
  const vaccineRecords: VaccineRecordWithDetails[] = await getPatientVaccineRecords(params.patientId) 
  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-col gap-4 w-full h-fit bg-slate-50 rounded-lg p-4'>
        <div className='flex flex-row justify-between'> 
          <h1 className='font-bold'>Vaccine Records</h1>
          <Link href={`/user/patients/${params.patientId}/vaccines/add-record`} className='px-4 py-2 bg-blue-500 text-white rounded-full text-sm'>Add Vaccine</Link>
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
    </div>
  )
}
