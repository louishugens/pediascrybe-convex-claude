
import AddVaccineForm from '@/components/addVaccineForm'
import { getDoctorTrackedVaccines } from '@/data/queries'
import Link from 'next/link'

export default async function Page({ params }: { params: { patientId: string } }) {

  const trackedVaccines = await getDoctorTrackedVaccines()

  return (
    <div className='h-full mb-8 mt-4'>
      <div className='flex flex-col gap-4 w-full h-fit bg-slate-50 rounded-lg p-4'>
        <h1 className='font-bold'>Add Vaccine Record</h1>
        {
          trackedVaccines && trackedVaccines.length > 0 ? (
            <AddVaccineForm vaccines={trackedVaccines} patientId={params.patientId} />
          ) : (
            <p className='text-sm text-muted-foreground'>No tracked vaccines found. Please click <Link href='/user/profile/add-vaccines' className='text-blue-500'>here</Link> to add tracked vaccines.</p>
          )
        }
      </div>
    </div>
  )
}
