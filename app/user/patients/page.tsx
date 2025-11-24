import Link from 'next/link'
import PatientList from '@/components/patientList'
import { Suspense } from "react";
import Search from "@/components/search";
import { Skeleton } from "@/components/ui/skeleton"
import { ViewTransition } from "react"

function PatientSkeleton() {
  return (
    <div className="basis-1/3 h-auto rounded-lg p-4 border border-slate-300">
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="flex flex-row justify-between mt-6">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
    </div>
  )
}

function PatientListSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-3 mt-4 pb-4">
      {Array.from({ length: 15 }).map((_, index) => (
        <PatientSkeleton key={index} />
      ))}
    </div>
  )
}





export default async function Patients(props) {
  const searchParams = props.searchParams;

  return (
    <div className='h-full mb-8 pb-4'>
      <div className="flex flex-row w-full justify-between">
        <p className=' font-bold text-white'><span className=' text-primary'>Patient list</span></p>
        <Link 
        className='self-end px-4 py-2 bg-blue-500 text-white rounded-full text-sm' 
        href={`/user/add-patient`}>Add Patient</Link>
      </div>
      <ViewTransition>
      <div className='flex w-full justify-center '>
        <Search />
      </div>
      
        <Suspense fallback={<PatientListSkeleton />}>
          <PatientList searchParams={searchParams} />
        </Suspense>
      </ViewTransition>
    </div>
  )
}


