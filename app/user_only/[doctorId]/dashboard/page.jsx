// 'use client'
// import React, { useEffect } from 'react'
// import supabase from '../../../../utils/supabase';
// import createClient from '../../../../utils/supabase-server'

// import useDoctor from '../../../../utils/hooks/useDoctor'

import Stats from "../../../../components/stats";
import prisma from "../../../../utils/prisma";

async function getDoctor(doctorId){
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
    include:{
      patients: true,
    },
  })
  return doctor
}

// export const dynamic = 'force-dynamic',
//   revalidate = 0;


export default async function Dashboard({ params: { doctorId } }) {

  const doctor = await getDoctor(doctorId)
  return (
    <div className=''>
      {doctor && <p className=' font-bold text-slate-900'>
        Hello <span className=' text-green-500'>
          Dr {doctor.firstname} {doctor.lastname}
        </span>
      </p>}
      <Stats patients={doctor.patients} />
      
    </div>
  );
}

