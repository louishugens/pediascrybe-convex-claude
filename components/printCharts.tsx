'use client'
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/solid'
import {useRef} from 'react'
// import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';
// import Chart from './chartPrint'
import Chart from './chartShad'
import { differenceInDays } from 'date-fns'
import PrintHead from './printHeader';


const Print = ({type, title, ylabel, xlabel, doctor, patient, data, yUnit, xUnit, mesure}) => {
  const string = 'Chart'
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${string}_${type}_${patient.firstname}_${patient.lastname}_${format(new Date(), 'yyy-MM-dd')}`
  });

  const path = type.split('-')[0]

  const leave = type === 'wfa' ? '/' : `/${path}`

  return (
    <div className='min-h-screen'>
      <div className="w-full shadow-md rounded-lg min-h-screen px-16 py-8 flex flex-col" 
ref={componentRef}>
        {/* <div className="flex flex-col items-center py-2">
            <h3 className=' text-2xl font-bold'><span className=' font-light'>Dr </span>{`${doctor.firstname} ${doctor.lastname}`}</h3>
            <h4 className=' text-xl font-light italic'>{doctor.spec}</h4>
            
        </div> */}
        <PrintHead doctor={doctor} />
        <div className="py-4 grow">
          <div className="flex flex-col h-full ">
            <p className='text-lg font-semibold text-center'>{`Growth Chart: ${title}`}</p>
            <div className="flex flex-row justify-between">
            <p className="font-bold"><span className='font-light'>Patient: </span>{`${patient.firstname} ${patient.lastname}`}</p>
              <p className="font-semibold"><span className='font-light'>Date: </span>{format(new Date(), 'yyy-MM-dd')}</p>
            </div>
            <div className="my-auto">
            {/* <p className="grow">Tests:</p> */}
            <div className="grow relative">
              <Chart type={type} title={title} ylabel={ylabel} xlabel={xlabel} data={data} yUnit={yUnit} xUnit={xUnit} name={patient.firstname} patient={patient} showTitle={false} mesure={mesure} />
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
        {/* <div className="flex flex-col items-center py-2">
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
        </div> */}
      </div>
      <div className="flex flex-row justify-between mt-6 pb-2 px-4">
        <button onClick={ () => handlePrint()} className="shadow bg-blue-500 rounded-full py-2 px-4 text-white text-sm">Print this out!</button>
        <Link href={`/user/patients/${patient.id}/charts${leave}`} className="px-4 py-2 rounded-full bg-slate-200 text-blue-500 text-sm">
          Leave
        </Link>
      </div>
    </div> 
  )
}

export default Print


