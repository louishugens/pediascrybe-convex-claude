'use client'
import { redirect } from 'next/navigation';
import Link from 'next/link'
import React from 'react'
import supabase from '../utils/supabase';
import { useRouter } from 'next/navigation';
import useDoctor from '../utils/hooks/useDoctor';

const Sidenav = ({doctorId}) => {

  const router = useRouter()
  const handleLogout = async () =>{
    const {error} = await supabase.auth.signOut()
    !error && router.push('/')
  }
  // const doctor = useDoctor()

  return (
   <div className='rounded-2xl h-full w-36 bg-green-500 shadow-lg sticky'>
      <div className="h-36 w-full bg-black/10 rounded-t-2xl pt-4">
        <Link href={`/user_only/${doctorId}/dashboard`}>
          <div className="bg-white block rounded-full relative h-28  w-28 mx-auto">
            <p className=' absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold  text-green-500 italic'>P</p>
          </div>
        </Link>
      </div>
      <ul className='pt-4 text-sm'>
        <li className='pl-4 pb-1 text-white'>
          <Link href={`/user_only/${doctorId}/patients`}>Patients</Link>
        </li>
        <li className='pl-4 pb-1 text-white'>
          <Link href={`/user_only/${doctorId}/appointments`}>Appointments</Link>
        </li>
        <li className='pl-4 pb-1 text-white'>
          <Link href={`/user_only/${doctorId}/profile`}>Profile</Link>
        </li>
        <li className='pl-4 pb-1 text-white'>
          <button onClick={handleLogout}>Sign out</button>
        </li>
      </ul>
      
    </div>
  )
}

export default Sidenav