'use client'
import { useState } from "react";
import Link from "next/link"
import { format } from 'date-fns'
import { useRouter } from "next/navigation";
import { ArrowUturnLeftIcon, PencilIcon, TrashIcon, PrinterIcon} from '@heroicons/react/24/outline'
import { FileIcon, EyeOff } from "lucide-react";
import {BeatLoader} from 'react-spinners'
import Image from "next/image";
import { X } from "lucide-react";
import { toast } from "sonner";
import UploadedFile from "./uploadedFile";
import { Id } from "@/convex/_generated/dataModel";

interface UploadedFile {
  _id: Id<"files">;
  url: string;
  name: string;
  fileType: "IMAGE" | "PDF" | "VIDEO";
}

interface Service {
  _id: Id<"services">;
  name: string;
  price: number;
  currency: string;
}

interface Appointment {
  _id: Id<"appointments">;
  startDate: number;
  cost?: number | null;
  motif?: string | null;
  findings?: string | null;
  otherRemarks?: string | null;
  recommendation?: string | null;
  height?: number | null;
  weight?: number | null;
  head?: number | null;
  arm?: number | null;
  sao2?: number | null;
  temperature?: number | null;
  pulse?: number | null;
  respiratory?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  prescriptions?: Array<{
    _id: Id<"prescriptions">;
    drug: string;
    count: number;
    unit: string;
    posology: string;
    status?: string;
  }>;
  labOrders?: Array<{
    _id: Id<"labOrders">;
    examName: string;
    status?: string;
  }>;
  internalNotes?: string | null;
  files: UploadedFile[];
  service: Service | null;
}

interface AppointmentPageComponentProps {
  appointment: Appointment
  patientId: string
}


const AppointmentPageComponent = ({appointment, patientId}: AppointmentPageComponentProps) => {
  const [loading, setLoading] = useState(false)
  const [loadingFile, setLoadingFile] = useState(false)
  let [color, setColor] = useState("#22C55E")

  const router = useRouter()
  const handleDelete = async () =>{
    if(window.confirm('Are you sure you want to delete appointment?')){
      try{
        setLoading(true)
        const body = {appointmentId: appointment._id}
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

  const medications = appointment.prescriptions ?? []
  const exams = appointment.labOrders ?? []

  return (
    <div className='py-4'>
    <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 text-sm text-slate-900">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <p className='text-primary'>Record of <span className='font-bold '>{format(appointment.startDate, 'yyy-MM-dd hh:mm:ss')}</span></p>
        </div>
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
            <Link href={`/user/patients/${patientId}/${appointment._id}/edit-appointment`} className="mr-2">
              <PencilIcon className="h-4 w-4" />
            </Link>
            <Link href={`/user/patients/${patientId}/${appointment._id}/print-appointment`} className="mr-2">
              <PrinterIcon className="h-4 w-4" />
            </Link>
            <button onClick={handleDelete}>
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        }
      </div>
      <div className="grid gap-x-8 gap-y-4 grid-cols-3 mt-4 mb-4">
        {appointment.service && (
          <p className="font-semibold">Service Type: <span className='font-normal'>{appointment.service.name}</span></p>
        )}
        {appointment.cost && (
          <p className="font-semibold">Cost: <span className='font-normal'>{Intl.NumberFormat('en-US', { style: 'currency', currency: appointment.service?.currency || 'HTG' }).format(appointment.cost)}</span></p>
        )}
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
          <p className="font-semibold mb-2">Other remarks</p>
          <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{appointment.otherRemarks}</p>
        </div>
        {appointment.internalNotes && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold">Internal Notes</p>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <EyeOff className="h-3 w-3" />
                Private
              </span>
            </div>
            <p className="w-full h-40 bg-amber-50 border border-dashed border-amber-300 rounded-md p-2 mt-1 overflow-scroll">{appointment.internalNotes}</p>
          </div>
        )}
        <div className="flex flex-col">
          <p className="font-semibold mb-2">Prescription</p>
          {/* <div className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{Array.isArray(medications) && medications.map((medication, index) =>{
            const typedMedication = medication as unknown as Medication
          return(
            <div key={index}>
              {medication && typeof(medication) === 'object' &&<>
              <p className="font-semibold">-{typedMedication.drug}, <span className="italic font-normal">{typedMedication?.count} {typedMedication.unit ? typedMedication.unit : 'flacon'}</span></p>
              <p>{typedMedication.posology}</p>
              </>}
            </div>
          )})}</div> */}
          <div className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{medications?.map((medication, index) =>(
            <div key={index}>
              <p className="font-semibold">-{medication.drug}, <span className="italic font-normal">{medication.count} {medication.unit ? medication.unit : 'flacon'}</span></p>
              <p>{medication.posology}</p>
            </div>
          ))}</div>
          <div className="mt-1 flex flex-row justify-between">
          <Link href={`/user/patients/${patientId}/${appointment._id}/add-prescription`} className='self-end mt-2 shadow bg-slate-200 rounded-full py-1 px-4 text-primary'>
              Add or edit
            </Link>
            <Link href={`/user/patients/${patientId}/${appointment._id}/print-prescription`} className='self-end mt-2 shadow bg-primary rounded-full py-1 px-4 text-primary-foreground'>
              Print
            </Link>
          </div>
        </div>
        <div className="flex flex-col">
          <p className="font-semibold mb-2">Lab exams</p>
          <ul className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{exams?.map((exam, index) =>(
            <li key={index}>-{exam.examName}</li>
          ))}</ul>
          <div className="mt-1 flex flex-row justify-between">
            {/* <Link href={`/user/patients/${patientId}/${appointmentId}/add-exams`} className='self-end mt-2 shadow bg-blue-500 rounded-full py-2 px-4 text-white '>
              Add
            </Link> */}
            <Link href={`/user/patients/${patientId}/${appointment._id}/add-exams`} className='self-end mt-2 shadow text-primary rounded-full py-1 px-4 bg-slate-200'>
              Add or edit
            </Link>
            <Link href={`/user/patients/${patientId}/${appointment._id}/print-exams`} className='self-end mt-2 shadow text-primary-foreground rounded-full py-1 px-4 bg-primary'>
              Print
            </Link>
          </div>
        </div>
        <div className="flex flex-col">
          <p className="font-semibold mb-2">Recommendations</p>
          <p className="w-full h-40 bg-slate-100 border border-slate-200 rounded-md p-2 mt-1 overflow-scroll">{appointment.recommendation}</p>
          <div className="mt-1 flex flex-row justify-between">
            <Link href={`/user/patients/${patientId}/${appointment._id}/add-recommendation`} className='self-end mt-2 shadow text-primary rounded-full py-1 px-4 bg-slate-200'>
              Add or edit
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <div className="flex flex-row items-center justify-between">
          <p className="font-semibold">Uploaded files</p>
          {
            appointment.files?.length < 3 &&
            <Link href={`/user/patients/${patientId}/${appointment._id}/upload-file`} className='self-end mt-2 shadow bg-slate-200 rounded-full py-1 px-4 text-primary'>
            Upload file
          </Link>}
        </div>
        <div className="flex flex-row w-full h-auto items-end gap-4 mt-2">
          {
            appointment.files?.length > 0 
            ?
              appointment.files?.map((file, index) => <UploadedFile key={index} file={file}/>

              )
            :
            <p className="italic text-muted-foreground">
              No files uploaded yet
            </p>
          }

        </div>
      </div>
    </div>
  </div>
  )
}

export default AppointmentPageComponent