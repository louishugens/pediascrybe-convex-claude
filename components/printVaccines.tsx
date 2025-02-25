'use client'
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/solid'
import {useRef} from 'react'
import { format } from 'date-fns'
import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';
import PrintHead from '@/components/printHeaderVax';
import { Doctor, Patient, VaccinationRecord, Vaccin, Dose } from '@prisma/client';
import { VaccineRecordsPrint } from '@/components/vaccineRecordsPrint';

type VaccineRecord = VaccinationRecord & {
  vaccin: Vaccin,
  dose: Dose
}

interface Props {
  doctor: Doctor,
  patient: Patient,
  vaccines: VaccineRecord[]
}


const Print = ({doctor, patient, vaccines}: Props) => {
  const string = 'Vaccination Records'
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${string}_${patient.firstname}_${patient.lastname}_${format(new Date(), 'yyyy-MM-dd-mm-ss')}`
  });

  return (
    <div className='pt-4 h-auto relative'>
      <style type="text/css" media="print">{`
        @page {
          size: landscape;
        }
      `}</style>
      <div 
        className="w-full min-h-screen shadow-md rounded-lg px-8 py-8 flex flex-col break-after-page relative" 
        ref={componentRef}
      >
        <PrintHead doctor={doctor} />
        <div className="py-4 grow text-sm">
          <div className="flex flex-row justify-between">
            <p className="font-medium"><span className='font-light'>Patient: </span>{`${patient.firstname} ${patient.lastname}`}</p>
            <p className='font-bold'>Vaccination Records</p>
            <p className="font-medium"><span className='font-light'>Date: </span>{format(new Date(), 'yyy-MM-dd')}</p>
          </div>
          <div className="flex flex-col h-full mt-8">
            <VaccineRecordsPrint records={vaccines} />
          </div>
        </div>
        <div className="flex flex-row-reverse">
          <div className="flex flex-row w-1/4">
            <p className='text-sm'>Signature:</p>
            <div className=" flex-1 h-px ml-1 mt-4 bg-black"></div>
          </div>
        </div>
      </div>
      <div className="flex flex-row justify-between pb-2 mt-6">
        <button onClick={ () => handlePrint()} className="shadow bg-blue-500 rounded-full py-2 px-4 text-white text-sm">Print this out!</button>
        <Link href={`/user/patients/${patient.id}/vaccines`} className="px-4 py-2 rounded-full bg-slate-200 text-blue-500 text-sm">
          Leave
        </Link>
      </div>
    </div> 
  )
}

export default Print
