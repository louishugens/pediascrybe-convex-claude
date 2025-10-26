// import "server-only";
'use server'
import prisma from "@/utils/prisma"
import Link from "next/link";
import { format, differenceInYears, formatDistanceToNow } from "date-fns";
import { createClient } from '@/utils/supabase/server'

async function getPatient(patientId){
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
  })
  return patient
}

type Params = Promise<{ patientId: string }>

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) => {
  const { patientId } = await params;

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const doctorId = user?.id
  const patient = await getPatient(patientId)
  
  return (
    <div className='flex flex-col w-full h-full'> 
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 ">
          <div className="flex flex-row w-full justify-between">
            <p className=' font-bold text-slate-900'>{patient?.firstname} {patient?.lastname}, <span className="text-sm font-normal">{formatDistanceToNow(new Date(patient?.birthdate ?? new Date()))} old</span></p>
            <Link
              className='px-4 py-1 bg-primary text-white rounded-full text-sm h-fit'
              href={`/user/patients/${patientId}/scrybegpt/`}
              >
              Chat
            </Link>
            {/* { 
              patient?.vectorId 
              ?
                <Link
                  className='px-4 py-2 bg-primary text-white rounded-full text-sm'
                  // href={`/user/scrybegpt/${patientId}`}
                  href={`/user/patients/${patientId}/scrybegpt/`}
                  >
                  Chat
                </Link>
              :
                <AddProfileDocument patient={patient} />
            } */}
            <Link 
            className='self-end px-4 py-2 bg-blue-500 text-white rounded-full text-sm' 
            href={`/user/patients/${patientId}/edit-patient`}>Edit Patient</Link>
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
      {/* <div className="h-full w-full overflow-y-scroll px-8 py-4"> */}
        {children}
      {/* </div> */}
    </div>
  )
}

export default Layout