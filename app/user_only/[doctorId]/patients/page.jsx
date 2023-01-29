import "server-only";
import prisma from "../../../../utils/prisma"
import Link from 'next/link'
import PatientList from '../../../../components/patientList'
import { BeatLoader } from "react-spinners";
import { Suspense } from "react";


async function getDoctor(doctorId){
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
    include: {
      patients:{
        orderBy:{
          lastname: 'asc'
        }
      },
    },
  })
  return doctor
}

export const dynamic = 'force-dynamic';


export default async function Patients({ params: { doctorId }}) {

  const {patients} = await getDoctor(doctorId)


  return (
    <div className='h-full'>
      <div className="flex flex-row w-full justify-between">
        <p className=' font-bold text-white'><span className=' text-green-500'>Patient list</span></p>
        <Link 
        className='self-end px-4 py-2 bg-blue-500 text-white rounded-full text-sm' 
        href={`/user_only/${doctorId}/patients/add-patient`}>Add Patient</Link>
      </div>
      <Suspense fallback={<Loading />}>
        <PatientList patients={patients} doctorId={doctorId} />
      </Suspense>
    </div>
  )
}

function Loading() {
  return <p>
    Loading patients 
    <BeatLoader color={"#000020"} />
  </p>
}