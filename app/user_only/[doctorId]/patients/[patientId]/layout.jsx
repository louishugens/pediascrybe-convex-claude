import "server-only";
import prisma from "../../../../../utils/prisma"
import Link from "next/link";
import { format } from "date-fns";

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

const Layout = async ({children, params: {doctorId, patientId }}) => {
  const patient = await getPatient(patientId)
  return (
    <div className='flex flex-col w-full'>
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 ">
          <div className="flex flex-row w-full justify-between">
            <p className=' font-bold text-slate-900'>{patient.firstname} {patient.lastname}</p>
            <Link 
            className='self-end px-4 py-2 bg-blue-500 text-white rounded-full text-sm' 
            href={`/user_only/${doctorId}/patients/add-patient`}>Edit Patient</Link>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <p className="text-sm">Birth date: <span className="font-bold">{format(new Date(patient.birthdate), 'dd-MM-yyyy')}</span></p>
            <p className="text-sm">Sex: <span className="font-bold">{patient.sex}</span></p>
            <p className="text-sm">Phone: <span className="font-bold">{patient.phone}</span></p>
            <p className="text-sm">Email: <span className="font-bold">{patient.email}</span></p>
            <p className="text-sm">Mother&apos;s name: <span className="font-bold">{patient.mothername}</span></p>
          </div>
        </div>
      {children}
    </div>
  )
}

export default Layout