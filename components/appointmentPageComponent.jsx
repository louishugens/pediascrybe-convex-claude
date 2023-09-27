'use client'
import { useState } from "react";
import Link from "next/link"
import { format } from 'date-fns'
import { useRouter } from "next/navigation";
import { ArrowUturnLeftIcon, PencilIcon, TrashIcon, PrinterIcon} from '@heroicons/react/24/outline'
import { FileIcon } from "lucide-react";
import {BeatLoader} from 'react-spinners'
import Image from "next/image";
import { X } from "lucide-react";
import toast, {Toaster} from "react-hot-toast";
import UploadedFile from "./uploadedFile";

const AppointmentPageComponent = ({appointment, doctorId, patientId}) => {
  const [loading, setLoading] = useState(false)
  const [loadingFile, setLoadingFile] = useState(false)
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
        router.push(`/user/patients/${patientId}`)
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
            <Link href={`/user/patients/${patientId}/`} className="mr-2">
              <ArrowUturnLeftIcon className="h-4 w-4" />
            </Link>
            <Link href={`/user/patients/${patientId}/${appointment.id}/edit-appointment`} className="mr-2">
              <PencilIcon className="h-4 w-4" />
            </Link>
            <Link href={`/user/patients/${patientId}/${appointment.id}/print-appointment`} className="mr-2">
              <PrinterIcon className="h-4 w-4" />
            </Link>
            <button onClick={handleDelete}>
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        }
      </div>
      <div className="grid gap-x-8 gap-y-4 grid-cols-3 mt-4 mb-4">
        <p className="font-semibold">Height: <span className='font-normal'>{appointment.height} cm</span></p>
        <p className="font-semibold">Weight: <span className='font-normal'>{appointment.weight} kg</span></p>
        <p className="font-semibold">Head Circumference: <span className='font-normal'>{appointment.head} cm</span></p>
        <p className="font-semibold">Arm Circumference: <span className='font-normal'>{appointment.arm} cm</span></p>
        <p className="font-semibold">SaO2: <span className='font-normal'>{appointment.sao2} %</span></p>
        <p className="font-semibold">Temperature: <span className='font-normal'>{appointment.temperature} °C</span></p>
        <p className="font-semibold">Pulse: <span className='font-normal'>{appointment.pulse} bpm</span></p>
        <p className="font-semibold">Respiratory Rate: <span className="font-normal">{appointment.respiratory} rpm</span></p>
        <p className="font-semibold">Systolic Blood Pressure: <span className='font-normal'>{appointment.systolic} mmHg</span></p>
        <p className="font-semibold">Diastolic Blood Pressure: <span className='font-normal'>{appointment.diastolic} mmHg</span></p>
      </div>
      <div className="grid gap-x-8 gap-y-4 grid-cols-2 mt-8">
        <div className="flex flex-col">
          <p className="font-semibold mb-2">Signs and Symptoms</p>
          <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{appointment.motif}</p>
        </div>
        <div className="flex flex-col">
          <p className="font-semibold mb-2">Diagnostic</p>
          <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{appointment.findings}</p>
        </div>
        <div className="flex flex-col">
          <p className="font-semibold mb-2">Prescription</p>
          <div className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{appointment.medication?.map((medication, index) =>(
            <div key={index}>
              <p className="font-semibold">-{medication.drug}, <span className="italic font-normal">{medication.count} {medication.unit ? medication.unit : 'flacon'}</span></p>
              <p>{medication.posology}</p>
            </div>
          ))}</div>
          <div className="mt-1 flex flex-row justify-between">
          <Link href={`/user/patients/${patientId}/${appointment.id}/add-prescription`} className='self-end mt-2 shadow bg-slate-200 rounded-full py-1 px-4 text-blue-500'>
              Add or edit
            </Link>
            <Link href={`/user/patients/${patientId}/${appointment.id}/print-prescription`} className='self-end mt-2 shadow bg-blue-500 rounded-full py-1 px-4 text-white'>
              Print
            </Link>
          </div>
        </div>
        <div className="flex flex-col">
          <p className="font-semibold mb-2">Lab exams</p>
          <ul className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{appointment.exams?.map((exam, index) =>(
            <li key={index}>-{exam.exam}</li>
          ))}</ul>
          <div className="mt-1 flex flex-row justify-between">
            {/* <Link href={`/user/patients/${patientId}/${appointmentId}/add-exams`} className='self-end mt-2 shadow bg-blue-500 rounded-full py-2 px-4 text-white '>
              Add
            </Link> */}
            <Link href={`/user/patients/${patientId}/${appointment.id}/add-exams`} className='self-end mt-2 shadow text-blue-500 rounded-full py-1 px-4 bg-slate-200'>
              Add or edit
            </Link>
            <Link href={`/user/patients/${patientId}/${appointment.id}/print-exams`} className='self-end mt-2 shadow text-slate-200 rounded-full py-1 px-4 bg-blue-500'>
              Print
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <div className="flex flex-row items-center justify-between">
          <p className="font-semibold">Uploaded files</p>
          {
            appointment.uploadedFiles?.length < 3 &&
            <Link href={`/user/patients/${patientId}/${appointment.id}/upload-file`} className='self-end mt-2 shadow bg-slate-200 rounded-full py-1 px-4 text-blue-500'>
            Upload file
          </Link>}
        </div>
        <div className="flex flex-row w-full h-auto items-end gap-4 mt-2">
          {
            appointment.uploadedFiles?.length > 0 
            ?
              appointment.uploadedFiles?.map((file, index) => <UploadedFile key={index} file={file}/>

              )
            :
            <p className="italic text-muted-foreground">
              No files uploaded yet
            </p>
          }

        </div>
      </div>
    </div>
    <Toaster />
  </div>
  )
}

export default AppointmentPageComponent