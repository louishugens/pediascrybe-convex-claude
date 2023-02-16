import "server-only";
import prisma from "../../../../../utils/prisma"
import Link from 'next/link'
import { format } from "date-fns";
// import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as CONST from '../../../../../utils/constants'
import Chart from "../../../../../components/chart";
import Charts from "../../../../../components/charts";
import Appointments from "../../../../../components/appointments";
import AppointmentComponent from "../../../../../components/appointment";


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

async function getAppointments(patientId){
  const patient = await prisma.appointment.findMany({
    where:{
      patientId: patientId
    },
    orderBy:{
      startDate: 'desc'
    },
  })
  return patient
}

export const dynamic = 'force-dynamic';

async function Patient({params: {doctorId, patientId }}) {
  const patient = await getPatient(patientId)
  const appointments = await getAppointments(patientId)

  return (
    <>
      <div className="flex flex-col w-full items-center">
          <Link href={`/user_only/${doctorId}/patients/${patientId}/charts`} className="mt-4 text-sm bg-blue-500 text-slate-900 rounded-full px-4 py-2 self-start">Growth Charts</Link>
        <div className="flex flex-row w-full justify-between pt-4">
          <p className=' font-bold text-white'><span className=' text-green-500'>Appointment list</span></p>
          <Link 
          className='self-end px-4 py-2 bg-blue-500 text-slate-100 rounded-full text-sm shadow' 
          href={`/user_only/${doctorId}/patients/${patientId}/add-appointment`}>Add Appointment</Link>
        </div>
        <table className="table-auto color-0 rounded-lg relative text-sm w-full mt-4 border-separate border-spacing-y-1.5">
          <thead className="rounded-t-lg  bg-blue-50">
            <tr className="rounded-full shadow">
              <th className="text-left px-4 py-2 rounded-l-full">Date</th>
              <th className="text-left px-4 py-2">Height</th>
              <th className="text-left px-4 py-2">Weight</th>
              <th className="text-left px-4 py-2">Head Circumference</th>
              <th className="text-left px-4 py-2 rounded-r-full">Actions</th>
            </tr>
          </thead>
          <tbody className='w-full'>
            {appointments.map(appointment => <AppointmentComponent appointment={appointment} doctorId={doctorId} patientId={patientId} data-superjson key={appointment.id} />
            )}
          </tbody>
        </table>
        
        {/* <Appointments doctorId={doctorId} patientId={patientId} /> */}

      </div>
    </>
  )
}

export default Patient