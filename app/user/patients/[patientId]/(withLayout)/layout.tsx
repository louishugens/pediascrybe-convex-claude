// import "server-only";
import prisma from "@/utils/prisma"
import Link from "next/link";
import { format } from "date-fns";
import {createServerClient} from '@/utils/supabase-server'
import AddProfileDocument from "@/components/addProfileDocument";

async function getPatient(patientId){
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
    // include: {
    //   patients:{
    //     orderBy:{
    //       lastname: 'asc'
    //     }
    //   },
    // },
  })
  return patient
}

export const dynamic = 'force-dynamic';

const Layout = async ({children, params: { patientId }}) => {
  const supabase = createServerClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id
  const patient = await getPatient(patientId)
  return (
    <div className='flex flex-col w-full'>
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 ">
          <div className="flex flex-row w-full justify-between">
            <p className=' font-bold text-slate-900'>{patient?.firstname} {patient?.lastname}</p>
            {/* { 
              patient.vectorId 
              ?
                <Link
                  className='px-4 py-2 bg-primary text-white rounded-full text-sm'
                  href={`/user/scrybegpt/${patientId}`}
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
          </div>
          <p className="text-sm font-semibold mt-4">History: <span className="font-normal">{patient?.history}</span></p>
        </div>
      {children}
    </div>
  )
}

export default Layout