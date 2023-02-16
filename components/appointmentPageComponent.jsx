'use client'
import { useState } from "react";
import Link from "next/link"
import { format } from 'date-fns'
import { useRouter } from "next/navigation";
import { ArrowUturnLeftIcon, PencilIcon, TrashIcon} from '@heroicons/react/24/outline'
import {BeatLoader} from 'react-spinners'

const AppointmentPageComponent = ({appointment, doctorId, patientId}) => {
  const [loading, setLoading] = useState(false)
  let [color, setColor] = useState("#22C55E")

  const router = useRouter()
  const handleDelete = async () =>{
    if(window.confirm('Are you sure you want to delete appointment?')){
      try{
        setLoading(true)
        const body = {appointmentId: appointment.id}
        await fetch('/api/patients/deleteAppointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        router.refresh()
        router.push(`/user_only/${doctorId}/patients/${patientId}`)

      }
      catch(err){
        console.log(err)
      }
    }
  }

  return (
    <div className='pt-4'>
    <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 text-sm text-slate-900 ">
      <div className="flex flex-row justify-between">
        <p className='text-blue-500'>Appointment of <span className='font-bold '>{format(appointment.startDate, 'yyy-MM-dd hh:mm:ss')}</span></p>
        {
          loading
          ?
          <BeatLoader
            color={color}
            size={10}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
          :
          <div className="flex flex-row justify-start">
            <Link href={`/user_only/${doctorId}/patients/${patientId}/`} className="mr-2">
              <ArrowUturnLeftIcon className="h-4 w-4" />
            </Link>
            <Link href={`/user_only/${doctorId}/patients/${patientId}/${appointment.id}/edit-appointment`} className="mr-2">
              <PencilIcon className="h-4 w-4" />
            </Link>
            <button onClick={handleDelete}>
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        }
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
            <Link href={`/user_only/${doctorId}/patients/${patientId}/${appointment.id}/print-prescription`} className='self-end mt-2 shadow bg-blue-500 rounded-full py-2 px-4 text-white'>
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
            <Link href={`/user_only/${doctorId}/patients/${patientId}/${appointment.id}/print-exams`} className='self-end mt-2 shadow text-slate-200 rounded-full py-2 px-4 bg-blue-500'>
              Print
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default AppointmentPageComponent