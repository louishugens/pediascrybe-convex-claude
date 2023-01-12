import "server-only";
import prisma from "../../../../../utils/prisma"
import Link from 'next/link'
import { format } from "date-fns";
// import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as CONST from '../../../../../utils/constants'
import Chart from "../../../../../components/chart";


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

async function Patient({params: {doctorId, patientId }}) {
  const patient = await getPatient(patientId)

  const {gwfa, gwfa2} = CONST

  return (
    <>
      <div className="flex flex-col w-full items-center">
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
          </div>
        </div>
        <p className="mt-4 text-slate-900 text-base font-semibold">Child Growth Charts</p>
        <div className="grid grid-cols-2 gap-4 mt-4 w-full">
          <Chart data={gwfa} />
          {/* <Chart data={gwfa2} /> */}
        </div>
      </div>
    </>
  )
}

export default Patient