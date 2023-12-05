// import "server-only";
import prisma from "@/utils/prisma"
import Link from 'next/link'
import PatientList from '@/components/patientList'
import { BeatLoader } from "react-spinners";
import { Suspense } from "react";
import {createServerClient} from '@/utils/supabase-server'
import Search from "@/components/search";


async function getPatients(doctorId, search){
  const patients = await prisma.patient.findMany({
    where:{
      doctorId:doctorId,
      OR:[
        {
          firstname:{
            contains: search,
            mode: 'insensitive' 
          }
        },
        {
          lastname:{
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          email:{
            contains: search,
            mode: 'insensitive'
          }
        },
      ] 

    },
    // include: {
    //   patients:{
    //     orderBy:{
    //       lastname: 'asc'
    //     }
    //   },
    // },
  })
  return patients
}

// export const dynamic = 'force-dynamic';


export default async function Patients({searchParams}) {

  const { search = '' } = searchParams
  // const search = ''

  const supabase = createServerClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id

  const patients = await getPatients(doctorId, search)

  return (
    <div className='h-full mb-8 pb-4'>
      <div className="flex flex-row w-full justify-between">
        <p className=' font-bold text-white'><span className=' text-primary'>Patient list</span></p>
        <Link 
        className='self-end px-4 py-2 bg-blue-500 text-white rounded-full text-sm' 
        href={`/user/add-patient`}>Add Patient</Link>
      </div>
      <div className='flex w-full justify-center '>
        <Search />
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