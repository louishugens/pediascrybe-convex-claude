import "server-only";
import prisma from "../../../../../utils/prisma"
import Link from 'next/link'
import { format } from "date-fns";
// import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as CONST from '../../../../../utils/constants'
import Chart from "../../../../../components/chart";
import Charts from "../../../../../components/charts";
import Appointments from "../../../../../components/appointments";


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
        {/* <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 ">
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
        </div> */}
          {/* <Charts sex={patient.sex} /> */}
        <div className="flex flex-row w-full justify-between pt-4">
          <p className=' font-bold text-white'><span className=' text-green-500'>Appointment list</span></p>
          <Link 
          className='self-end px-4 py-2 bg-blue-500 text-slate-100 rounded-full text-sm shadow' 
          href={`/user_only/${doctorId}/patients/${patientId}/add-appointment`}>Add Appointment</Link>
        </div>
        <Appointments doctorId={doctorId} patientId={patientId} />

      </div>
    </>
  )
}

export default Patient