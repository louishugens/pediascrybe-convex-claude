import React from 'react'
import prisma from '../../../../../../utils/prisma'
import { format } from 'date-fns'
import Link from 'next/link'

async function getAppointment(appointmentId){
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment
}
export const dynamic = 'force-dynamic';
const AppointmentPage = async ({params: {doctorId, patientId, appointmentId}}) => {
  const appointment = await getAppointment(appointmentId)
  return (
    <div className='pt-4'>
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 text-sm text-slate-900 ">
        <div className="flex flex-row justify-between">
          <p className='text-blue-500'>Appointment of <span className='font-bold '>{format(appointment.startDate, 'yyy-MM-dd hh:mm:ss')}</span></p>
          <Link href={`/user_only/${doctorId}/patients/${patientId}`} className="px-4 py-2 rounded-full bg-slate-200 text-blue-500">
            Leave
          </Link>
        </div>
        <div className="grid gap-x-8 gap-y-4 grid-cols-3 mt-4">
          <p>Height: <span className='font-bold'>{appointment.height} cm</span></p>
          <p>Weight: <span className='font-bold'>{appointment.weight} kg</span></p>
          <p>Head Circumference: <span className='font-bold'>{appointment.head} cm</span></p>
        </div>
        <div className="grid gap-x-8 gap-y-4 grid-cols-2 mt-4">
          <div className="flex flex-col">
            <p className="font-bold">Symptoms</p>
            <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{appointment.motif}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-bold">Diagnostic</p>
            <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{appointment.findings}</p>
          </div>
          <div className="flex flex-col">
            <p className="font-bold">Prescription</p>
            <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{appointment.medication}</p>
            <div className="mt-1 flex flex-row-reverse">
              <Link href={`/user_only/${doctorId}/patients/${patientId}/${appointmentId}/print-prescription`} className='self-end mt-2 shadow bg-blue-500 rounded-full py-2 px-4 text-white'>
                Print
              </Link>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="font-bold">Lab exams</p>
            <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{appointment.exams}</p>
            <div className="mt-1 flex flex-row-reverse justify-between">
              {/* <Link href={`/user_only/${doctorId}/patients/${patientId}/${appointmentId}/add-exams`} className='self-end mt-2 shadow bg-blue-500 rounded-full py-2 px-4 text-white '>
                Add
              </Link> */}
              <Link href={`/user_only/${doctorId}/patients/${patientId}/${appointmentId}/print-exams`} className='self-end mt-2 shadow text-slate-200 rounded-full py-2 px-4 bg-blue-500'>
                Print
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppointmentPage