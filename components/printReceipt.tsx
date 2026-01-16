'use client'
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/solid'
import {useRef} from 'react'
// import { useReactToPrint } from 'react-to-print'
import { format } from 'date-fns'
import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';
import PrintHead from '@/components/printHeader';
import { Doc } from '@/convex/_generated/dataModel';
import { Preview } from '@/components/preview';

interface Props {
  doctor: Doc<"doctors">,
  patient: Doc<"patients">,
  receipt: Doc<"receipts">,
  lang: string
}

interface Service {
  service: string
  price: number
}

const Print = ({doctor, patient, receipt, lang}: Props) => {
  const string = "Receipt"
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${string}_${patient.firstname}_${patient.lastname}_${format(receipt.createdAt, 'yyy-MM-dd')}`
  });

  const services = receipt.services as unknown as Service[]
  return (
    <div className='pt-4 h-auto relative '>
      <div 
        className="w-full min-h-screen shadow-md rounded-lg px-16 py-8 flex flex-col  break-after-page relative" 
        ref={componentRef}
      >
        <PrintHead doctor={doctor} />

        <div className="py-4 grow">
          <div className="flex flex-col h-full ">
            <p className='text-lg font-semibold text-center py-4 flex-none'>Receipt</p>
            <div className="flex flex-row justify-between flex-none">
              <p className="font-bold"><span className='font-light'>Patient: </span>{`${patient.firstname} ${patient.lastname}`}</p>
              <p className="font-semibold"><span className='font-light'>Date: </span>{receipt.date && format(receipt.date, 'yyy-MM-dd')}</p>
            </div>
            <div className="grow">
              <div className="my-8">
                {/* <Preview 
                  value={report.content}
                /> */}
                <div className="flex flex-row justify-between items-start bg-slate-100 rounded-full px-6 py-2 text-sm">
                  <p className="font-semibold basis-1/2">Service</p>
                  <p className="font-semibold basis-1/2">Cost</p>
                </div>
                {
                  services?.map((service, index:number) => (
                    <div key={index} className="flex flex-row justify-between items-start mt-1 rounded-full px-6 pt-2 text-sm">
                      <p className="font-normal basis-1/2">{service.service}</p>
                      <p className="font-normal basis-1/2">
                        {      
                      new Intl.NumberFormat(lang, {
                        style: 'currency',
                        currency: receipt.currency!
                      }).format(service.price!)}
                      </p>
                    </div>
                  ))
                }
                  {/* <div className="flex flex-row justify-between items-start mt-2 rounded-full px-6 py-3 text-sm">
                  <p className="font-normal basis-1/2">{receipt.service}</p>
                  <p className="font-normal basis-1/2">
                    {      
                  new Intl.NumberFormat(lang, {
                    style: 'currency',
                    currency: receipt.currency!
                  }).format(receipt.cost!)}
                  </p>
                </div> */}
                <div className="flex flex-row-reverse items-end text-sm mt-8">
                  <p className="font-semibold shrink basis-1/2 self-end bg-slate-100 rounded-full px-6 py-2">Total: {      
                  new Intl.NumberFormat(lang, {
                    style: 'currency',
                    currency: receipt.currency!
                  }).format(services?.reduce((sum, current) => sum + current.price, 0))}</p>
                </div>
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
        <button onClick={ () => handlePrint()} className="shadow bg-primary rounded-full py-2 px-4 text-primary-foreground text-sm">Print this out!</button>
        <Link href={`/user/patients/${patient._id}/receipts`} className="px-4 py-2 rounded-full bg-muted text-primary text-sm">
          Leave
        </Link>
      </div>
    </div> 
  )
}

export default Print


