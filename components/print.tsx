'use client'
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/solid'
import {useRef} from 'react'
// import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';
import PrintHead from './printHeader';



const Print = ({appointment, doctor, patient, exams, backUrl}: {appointment: any, doctor: any, patient: any, exams: boolean, backUrl?: string}) => {
  const string = exams ? "Tests" : "Prescriptions"
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${string}_${patient.firstname}_${patient.lastname}_${format(appointment.startDate, 'yyy-MM-dd')}`
  });


  return (
    <div className='pt-4 h-auto relative '>
      <div 
        className="w-full min-h-screen shadow-md rounded-lg px-16 py-8 flex flex-col  break-after-page relative" 
        ref={componentRef}
      >
        <PrintHead doctor={doctor} />
        {/* <div className="flex flex-col items-center py-2">
          <h3 className=' text-2xl font-bold'><span className=' font-light'>Dr </span>{`${doctor.firstname} ${doctor.lastname}`}</h3>
          <h4 className=' text-xl font-light italic'>{doctor.spec}</h4>
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
          {doctor.address && <p className='font-light text-sm flex flex-row'>
            <MapPinIcon className="h-3 w-3 mt-1"/>
            <span>
              : {doctor.address}
            </span>
          </p>}
        </div> */}
        <div className="py-4 grow">
          <div className="flex flex-col h-full ">
            <p className='text-lg font-semibold text-center py-4 flex-none'>{exams ? "Laboratory Tests" : "Medical Prescription"}</p>
            <div className="flex flex-row justify-between flex-none">
              <p className="font-bold"><span className='font-light'>Patient: </span>{`${patient.firstname} ${patient.lastname}`}</p>
              <p className="font-semibold"><span className='font-light'>Date: </span>{format(appointment.startDate, 'yyy-MM-dd')}</p>
            </div>
            <div className="grow">
              <div className="my-8">
                {
                  exams 
                  ? 
                    appointment.exams?.map((exam, index) =>(
                      <p key={index} className="font-bold">-{exam.exam}</p>
                    ))
                  : 
                    appointment.medication?.map((medication, index) =>(
                      <div key={index}>
                        <p className="font-bold">-{medication.drug}, <span className="italic font-normal">{medication.count} {medication.unit ? medication.unit : 'flacon'}</span></p>
                        <p>{medication.posology}</p>
                      </div>
                    ))
                }
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
        <div className="flex flex-row-reverse">
          <div className="flex flex-row w-2/5">
            <p>Signature:</p>
            <div className=" flex-1 h-px ml-1 mt-4 bg-black"></div>
          </div>
        </div>
        {/* <div className="flex flex-col items-center py-2 h-12 ">
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
          {doctor.address && <p className='font-light text-sm flex flex-row'>
            <MapPinIcon className="h-3 w-3 mt-1"/>
            <span>
              : {doctor.address}
            </span>
          </p>}
        </div> */}
      </div>
      <div className="flex flex-row justify-between pb-2 mt-6">
        <button onClick={() => handlePrint()} className="shadow bg-primary rounded-full py-2 px-4 text-primary-foreground text-sm">Print this out!</button>
        <Link href={(backUrl || `/user/patients/${patient._id}/${appointment._id}`) as any} className="px-4 py-2 rounded-full bg-muted text-primary text-sm">
          Leave
        </Link>
      </div>
    </div> 
  )
}

export default Print


