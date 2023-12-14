// 'use client'
// import React, { useEffect } from 'react'
// import supabase from '../../../../utils/supabase';
// import {createServerClient} from '@/utils/supabase-server'
// import supabase from '@/utils/supabase-ssr'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from "next/headers";

// import useDoctor from '../../../../utils/hooks/useDoctor'

import Stats from "@/components/stats";
import prisma from "@/utils/prisma";

async function getDoctor(doctorId){
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
    include:{
      patients: {
        include:{
          appointments: true,
        },
      },
    },
  })
  return doctor
}

// export const dynamic = 'force-dynamic';



export default async function Dashboard() {

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
  console.log('doctorId :>> ', doctorId);

  const doctor = await getDoctor(doctorId)
  const patients = doctor?.patients

  return (
    <div className=''>
      {doctor && <p className=' font-bold text-slate-900'>
        Hello <span className=' text-green-500'>
          Dr {doctor.firstname} {doctor.lastname}
        </span>
      </p>}
      <Stats patients={patients} />
      
    </div>
  );
}

