'use server'
import Link from "next/link";
import { format, differenceInYears, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react";
import DemographicData from "@/components/patient/demographicData";
import { ViewTransition } from "react";

type Params = Promise<{ patientId: string }>

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) => {
  
  return (
    <div className='flex flex-col w-full h-full'> 
      <ViewTransition>
        <Suspense fallback={<DemographicDataSkeleton />}>
          <DemographicData params={params} />
        </Suspense>
      </ViewTransition>
        {children}
    </div>
  )
}

export default Layout

async function DemographicDataSkeleton() {
  return (
    <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 ">
      <div className="flex flex-row w-full justify-between">
        <div className='font-bold text-slate-900 flex flex-row gap-2'>
          <Skeleton className="h-4 w-12 mb-2 bg-slate-200" /> 
          <Skeleton className="h-4 w-12 mb-4 bg-slate-200" /> 
          <Skeleton className="h-4 w-12 mb-4 bg-slate-200" />
          </div>
        <Skeleton className="h-6 w-16 rounded-full bg-green-200" />
        <Skeleton className="h-6 w-16 rounded-full bg-blue-200" />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-sm font-semibold flex flex-row gap-2 align-center">Birth date: <span className="font-normal "><Skeleton className="h-4 w-12 mb-4 bg-slate-200" /></span></div>
        <div className="text-sm font-semibold flex flex-row gap-2 align-center">Sex: <span className="font-normal"><Skeleton className="h-4 w-12 mb-4 bg-slate-200" /></span></div>
        <div className="text-sm font-semibold flex flex-row gap-2 align-center">Phone: <span className="font-normal"><Skeleton className="h-4 w-12 mb-4 bg-slate-200" /></span></div>
        <div className="text-sm font-semibold flex flex-row gap-2 align-center">Email: <span className="font-normal"><Skeleton className="h-4 w-12 mb-4 bg-slate-200" /></span></div>
        <div className="text-sm font-semibold flex flex-row gap-2 align-center">Mother&apos;s name: <span className="font-normal"><Skeleton className="h-4 w-12 mb-4 bg-slate-200" /></span></div>
        <div className="text-sm font-semibold flex flex-row gap-2 align-center">Religion: <span className="font-normal"><Skeleton className="h-4 w-12 mb-4 bg-slate-200" /></span></div>
        <div className="text-sm font-semibold flex flex-row gap-2 align-center">Allergies: <span className="font-normal"><Skeleton className="h-4 w-12 mb-4 bg-slate-200" /></span></div>
        <div className="text-sm font-semibold flex flex-row gap-2 align-center">Blood type: <span className="font-normal"><Skeleton className="h-4 w-12 mb-4 bg-slate-200" /></span></div>
        <div className="text-sm font-semibold flex flex-row gap-2 align-center">Electrophoresis: <span className="font-normal"><Skeleton className="h-4 w-12 mb-4 bg-slate-200" /></span></div>
      </div>
      <div className="text-sm font-semibold mt-4 flex flex-row gap-2 align-center">History: <span className="font-normal"><Skeleton className="h-4 w-12 mb-4 bg-slate-200" /></span></div>
    </div>
  )
}
