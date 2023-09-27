'use client'
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/solid'
import {useRef} from 'react'
// import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';


const Print = ({appointment, doctor, patient}) => {

  const string = 'appointment'

  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${string}_${patient.firstname}_${patient.lastname}_${format(appointment.startDate, 'yyy-MM-dd')}`
  });

  // console.log('appointment', appointment)

  return (
    <div className="">
    <div className='pt-4 min-h-screen  shadow-md rounded-lg overflow-y-auto'>
      <div className="w-full h-screen p-16 flex flex-col divide-y divide-slate-900" 
ref={componentRef}>
        <div className="flex flex-col items-center py-2">
          <h3 className=' text-2xl font-bold'><span className=' font-light'>Dr </span>{`${doctor.firstname} ${doctor.lastname}`}</h3>
          <h4 className=' text-xl font-light italic'>{doctor.spec}</h4>
          <p className='text-lg font-semibold'>Appointment</p>
        </div>
        <div className="py-4 grow">
          <div className="flex flex-col h-full ">
            <div className="flex flex-row justify-between">
              <p className="font-bold"><span className='font-light'>Patient: </span>{`${patient.firstname} ${patient.lastname}`}</p>
              <p className="font-semibold"><span className='font-light'>Date: </span>{format(appointment.startDate, 'yyy-MM-dd')}</p>
            </div>
            <div className="grid gap-x-4 gap-y-4 grid-cols-3 mt-4 mb-4">
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
            <div className="grid gap-x-8 gap-y-2 grid-cols-1 mt-4">
              <div className="flex flex-col">
                <p className="font-semibold">Signs and Symptoms</p>
                <p className="w-full h-auto px-2 pt-0 pb-2 mt-1">{appointment.motif}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold">Diagnostic</p>
                <p className="w-full h-auto px-2 pt-0 pb-2 mt-1">{appointment.findings}</p>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold">Prescription</p>
                <div className="w-full h-auto px-2 pt-0 pb-2 mt-1">
                  {appointment.medication?.map((medication, index) =>(
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
                  {appointment.exams?.map((exam, index) =>(
                    <li key={index}>-{exam.exam}</li>
                  ))}
                </ul>
              </div>
            </div>
            {/* <div className="flex flex-row-reverse">
              <div className="flex flex-row w-1/3">
                <p>Signature:</p>
                <div className=" flex-1 h-px ml-1 mt-4 bg-black"></div>
              </div>
            </div> */}
          </div>
        </div>
        <div className="flex flex-col items-center py-2">
          <p className="font-light text-sm flex flex-row">
            <PhoneIcon className="h-3 w-3 mt-1"/>
            <span>
            : {doctor.phone}, &nbsp; 
            </span>
            <EnvelopeIcon className="h-3 w-3 mt-1"/>
            <span>
            : {doctor.email}
            </span>
          </p>
        </div>
      </div>

    </div> 
    <div className="flex flex-row justify-between py-4">
        <button onClick={handlePrint} className="shadow bg-blue-500 rounded-full py-2 px-4 text-white text-sm">Print this out!</button>
        <Link href={`/user/patients/${patient.id}/${appointment.id}`} className="px-4 py-2 rounded-full bg-slate-200 text-blue-500 text-sm">
          Leave
        </Link>
      </div>
    </div>
  )
}

export default Print


