'use client'
import { redirect } from 'next/navigation';
import Link from 'next/link'
import React from 'react'
import supabase from '../../utils/supabase';

const Sidenav = () => {
  const handleLogout = async () =>{
    const {error} = await supabase.auth.signOut()
    !error && redirect('/')
  }
  return (
    <div className='rounded-2xl h-full w-36 bg-green-500 shadow-lg'>
      <div className="h-36 w-full bg-black/10 rounded-t-2xl pt-4">
        <Link href='/user_only/dashboard'>
          <div className="bg-white block rounded-full relative h-28  w-28 mx-auto">
            <p className=' absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold  text-green-500 italic'>P</p>
          </div>
        </Link>
      </div>
      <ul className='pt-4'>
        <li className='pl-4 pb-1 text-white'>
          <Link href='/user_only/patients'>Patients</Link>
        </li>
        <li className='pl-4 pb-1 text-white'>
          <Link href='/user_only/appointments'>Appointments</Link>
        </li>
        <li className='pl-4 pb-1 text-white'>
          <Link href='/user_only/profile'>Profile</Link>
        </li>
        <li className='pl-4 pb-1 text-white'>
          <button onClick={handleLogout}>Sign out</button>
        </li>
      </ul>
      
    </div>
  )
}

export default Sidenav