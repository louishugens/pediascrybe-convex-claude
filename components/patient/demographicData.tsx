import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { cacheTag } from 'next/cache';
import DeletePatientButton from './deletePatientButton';
import { fetchAuthQuery } from '@/lib/auth-server';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export default async function DemographicData({ params }: { params: Promise<{ patientId: string }> }) {
  "use cache"
  
  const { patientId } = await params;
  cacheTag(`patient-profile-${patientId}`)

  const patient = await fetchAuthQuery(api.patients.getPatient, { 
    patientId: patientId as Id<"patients"> 
  });
  
  return (
    <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 ">
      <div className="flex flex-row w-full justify-between">
        <p className=' font-bold text-slate-900'>{patient?.firstname} {patient?.lastname}, <span className="text-sm font-normal">{formatDistanceToNow(new Date(patient?.birthdate ?? new Date()))} old</span></p>
        <Link
          className='px-4 py-1 bg-primary text-white rounded-full text-sm h-fit'
          href={`/user/patients/${patientId}/scrybegpt/`}
        >
          Chat
        </Link>
        <div className="flex flex-row gap-2">
          <Link 
            className='px-4 py-1 bg-blue-500 text-white rounded-full text-sm' 
            href={`/user/patients/${patientId}/edit-patient`}
          >
            Edit Patient
          </Link>
          <DeletePatientButton patientId={patientId as Id<"patients">} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <p className="text-sm font-semibold">Birth date: <span className="font-normal ">{patient?.birthdate && format(new Date(patient.birthdate), 'dd-MM-yyyy')}</span></p>
        <p className="text-sm font-semibold">Sex: <span className="font-normal">{patient?.sex}</span></p>
        <p className="text-sm font-semibold">Phone: <span className="font-normal">{patient?.phone}</span></p>
        <p className="text-sm font-semibold">Email: <span className="font-normal">{patient?.email}</span></p>
        <p className="text-sm font-semibold">Mother&apos;s name: <span className="font-normal">{patient?.mothername}</span></p>
        <p className="text-sm font-semibold">Religion: <span className="font-normal">{patient?.religion}</span></p>
        <p className="text-sm font-semibold">Allergies: <span className="font-normal">{patient?.allergies}</span></p>
        <p className="text-sm font-semibold">Blood type: <span className="font-normal">{patient?.bloodtype}</span></p>
        <p className="text-sm font-semibold">Electrophoresis: <span className="font-normal">{patient?.electrophoresis}</span></p>
      </div>
      <p className="text-sm font-semibold mt-4">History: <span className="font-normal">{patient?.history}</span></p>
    </div>
  )
}
