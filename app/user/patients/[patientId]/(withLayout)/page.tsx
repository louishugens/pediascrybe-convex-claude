// import "server-only";
'use server'
import prisma from "@/utils/prisma"
import Link from 'next/link'
import AppointmentComponent from "@/components/appointment";
// import {createServerClient} from '@/utils/supabase-server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'


async function getAppointments(patientId){
  const patient = await prisma.appointment.findMany({
    where:{
      patientId: patientId
    },
    orderBy:{
      startDate: 'desc'
    },
  })
  
  return patient

}

// export const dynamic = 'force-dynamic';

async function Patient({params: {patientId }}) {
  // const supabase = createServerClient()
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id

  const appointments = await getAppointments(patientId)

  return (
    <>
      <div className="flex flex-col w-full items-center">
        <div className="flex flex-row w-full gap-4">
          <Link href={`/user/patients/${patientId}/charts`} className="mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start">Growth Charts</Link>
          <Link href={`/user/patients/${patientId}/reports`} className="mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start">Reports, Certificates and Reference Notes</Link>
          <Link href={`/user/patients/${patientId}/receipts`} className="mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start">Receipts</Link>
        </div>
        <div className="flex flex-row w-full justify-between pt-4">
          <p className=' font-bold text-white'><span className=' text-primary'>Consultation list</span></p>
          <Link 
          className='self-end px-4 py-2 bg-blue-500 text-slate-100 rounded-full text-sm shadow' 
          href={`/user/patients/${patientId}/add-appointment`}>Add Consultation</Link>
        </div>
        <table className="table-auto color-0 rounded-lg relative text-sm w-full mt-4 border-separate border-spacing-y-1.5">
          <thead className="rounded-t-lg  bg-blue-50">
            <tr className="rounded-full shadow">
              <th className="text-left px-4 py-2 rounded-l-full">Date</th>
              <th className="text-left px-4 py-2">Height</th>
              <th className="text-left px-4 py-2">Weight</th>
              <th className="text-left px-4 py-2">Head Circumference</th>
              <th className="text-left px-4 py-2 rounded-r-full">Actions</th>
            </tr>
          </thead>
          <tbody className='w-full'>
            {appointments.map(appointment => <AppointmentComponent appointment={appointment} doctorId={doctorId} patientId={patientId} data-superjson key={appointment.id} />
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Patient