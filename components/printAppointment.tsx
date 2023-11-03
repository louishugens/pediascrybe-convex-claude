'use client'
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/solid'
import {useRef} from 'react'
// import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';
import PrintHead from './printHeader';
import { Appointment, Doctor, Patient } from '@prisma/client';

interface PrintProps {
  appointment: Appointment | null
  doctor: Doctor | null
  patient: Patient | null
}

const Print = ({appointment, doctor, patient}: PrintProps) => {

  const string = 'appointment'

  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${string}_${patient?.firstname}_${patient?.lastname}_${appointment?.startDate ? format(appointment.startDate, 'yyy-MM-dd') : ''}`
  });

  interface Medication{
    drug: string
    posology: string
    count: number
    unit: string
  }
  
  interface Exam{
    exam: string
  }

  const medication = appointment?.medication as unknown as Medication[]
  const exams = appointment?.exams as unknown as Exam[]

  return (
    <div className="">
    <div className='pt-4 min-h-screen  shadow-md rounded-lg overflow-y-auto'>
      <div className="w-full min-h-screen px-16 py-8 flex flex-col overflow-auto" 
ref={componentRef}>
        <PrintHead doctor={doctor} />
        <div className="py-4 grow">
          <div className="flex flex-col h-full ">
            <div className="flex flex-row justify-between pt-4 pb-8">
              <p className='text-lg font-semibold'>Appointment</p>
              <p className="font-semibold"><span className='font-light'>Date: </span>{appointment?.startDate && format(new Date(appointment.startDate), 'yyy-MM-dd')}</p>
            </div>
          
            <div className="flex flex-col mb-8">
              <p className='text-xl font-light italic text-center'>Patient&apos;s info</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <p className="text-base font-semibold">Birth date: <span className="font-normal ">{patient?.birthdate && format(new Date(patient.birthdate), 'dd-MM-yyyy')}</span></p>
                <p className="text-base font-semibold">Sex: <span className="font-normal">{patient?.sex}</span></p>
                <p className="text-base font-semibold">Phone: <span className="font-normal">{patient?.phone}</span></p>
                <p className="text-base font-semibold">Email: <span className="font-normal">{patient?.email}</span></p>
                <p className="text-base font-semibold">Mother&apos;s name: <span className="font-normal">{patient?.mothername}</span></p>
                <p className="text-base font-semibold">Religion: <span className="font-normal">{patient?.religion}</span></p>
                <p className="text-base font-semibold">Allergies: <span className="font-normal">{patient?.allergies}</span></p>
                <p className="text-base font-semibold">Blood type: <span className="font-normal">{patient?.bloodtype}</span></p>
              </div>
              <p className="text-base font-semibold mt-4">History: <span className="font-normal">{patient?.history}</span></p>
            </div>
            <p className='text-xl font-light italic text-center mb-4'>Appointment&apos;s info</p>
            <div className="grid gap-x-4 gap-y-4 grid-cols-3 mt-4 mb-4">
              <p className="font-semibold">Height: <span className='font-normal'>{appointment?.height} cm</span></p>
              <p className="font-semibold">Weight: <span className='font-normal'>{appointment?.weight} kg</span></p>
              <p className="font-semibold">Head Circumference: <span className='font-normal'>{appointment?.head} cm</span></p>
              <p className="font-semibold">Arm Circumference: <span className='font-normal'>{appointment?.arm} cm</span></p>
              <p className="font-semibold">SaO2: <span className='font-normal'>{appointment?.sao2} %</span></p>
              <p className="font-semibold">Temperature: <span className='font-normal'>{appointment?.temperature} °C</span></p>
              <p className="font-semibold">Pulse: <span className='font-normal'>{appointment?.pulse} bpm</span></p>
              <p className="font-semibold">Respiratory Rate: <span className="font-normal">{appointment?.respiratory} rpm</span></p>
              <p className="font-semibold">Systolic Blood Pressure: <span className='font-normal'>{appointment?.systolic} mmHg</span></p>
              <p className="font-semibold">Diastolic Blood Pressure: <span className='font-normal'>{appointment?.diastolic} mmHg</span></p>
            </div>
            <div className="grid gap-x-8 gap-y-2 grid-cols-1 mt-4">
              <div className="flex flex-col">
                <p className="font-semibold">Signs and Symptoms</p>
                <p className="w-full h-auto px-2 pt-0 pb-2 mt-1">{appointment?.motif}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold">Diagnostic</p>
                <p className="w-full h-auto px-2 pt-0 pb-2 mt-1">{appointment?.findings}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold">Prescription</p>
                <div className="w-full h-auto px-2 pt-0 pb-2 mt-1">
                  {medication.map((medication, index) =>(
                    <div key={index}>
                      <p className="font-semibold">-{medication.drug}, <span className="italic font-normal">{medication.count} {medication.count > 1 ? "flacons": "flacon"}</span></p>
                      <p>{medication.posology}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold">Lab exams</p>
                <ul className="w-full h-auto px-2 pt-0 pb-2 mt-1 overflow-scroll">
                  {exams?.map((exam, index) =>(
                    <li key={index}>-{exam.exam}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold">Recommendations</p>
                <p className="w-full h-auto px-2 pt-0 pb-2 mt-1">{appointment?.recommendation}</p>
              </div>
              
            </div>

          </div>
        </div>
        <div className="flex flex-row-reverse py-4">
          <div className="flex flex-row w-2/5">
            <p>Signature:</p>
            <div className=" flex-1 h-px ml-1 mt-4 bg-black"></div>
          </div>
        </div>
      </div>

    </div> 
    <div className="flex flex-row justify-between py-4">
        <button onClick={handlePrint} className="shadow bg-blue-500 rounded-full py-2 px-4 text-white text-sm">Print this out!</button>
        <Link href={`/user/patients/${patient?.id}/${appointment?.id}`} className="px-4 py-2 rounded-full bg-slate-200 text-blue-500 text-sm">
          Leave
        </Link>
      </div>
    </div>
  )
}

export default Print


