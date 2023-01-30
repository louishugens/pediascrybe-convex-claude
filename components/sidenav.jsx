'use client'
import { redirect } from 'next/navigation';
import Link from 'next/link'
import React from 'react'
import supabase from '../utils/supabase';
import { useRouter } from 'next/navigation';
import useDoctor from '../utils/hooks/useDoctor';
import { ArrowRightOnRectangleIcon, ListBulletIcon, PencilIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const Sidenav = ({doctorId}) => {

  const router = useRouter()
  const handleLogout = async () =>{
    const {error} = await supabase.auth.signOut()
    !error && router.push('/')
  }
  // const doctor = useDoctor()

  return (
   <div className='h-full w-64  bg-green-50 shadow sticky px-8'>
      <div className="pt-4">
        <Link href={`/user_only/${doctorId}/dashboard`}>
          <p className='text-xl font-bold  text-green-500 italic'>Pediascrybe</p>
        </Link>
      </div>
      <ul className='pt-16 text-sm text-slate-900'>
        <li className=' pb-2  flex flex-row'>
          <UserGroupIcon className=' h-5 w-5 mr-4' />
          <Link href={`/user_only/${doctorId}/patients`}>Patients</Link>
        </li>
        <li className=' pb-2  flex flex-row'>
          <UserPlusIcon className=' h-5 w-5 mr-4' />
          <Link href={`/user_only/${doctorId}/patients/add-patient`}>Add Patient</Link>
        </li>
        {/* <li className=' pb-2 '>
          <Link href={`/user_only/${doctorId}/appointments`}>Appointments</Link>
        </li> */}
        <li className=' pb-2  flex flex-row'>
          <ListBulletIcon className=' h-5 w-5 mr-4'/>
          <Link href={`/user_only/${doctorId}/profile`}>Profile</Link>
        </li>
        <li className=' pb-2  flex flex-row'>
          <PencilIcon className=' h-5 w-5 mr-4' />
          <Link href={`/user_only/${doctorId}/profile/edit-profile`}>Edit Profile</Link>
        </li>
        <li className=' pb-2  flex flex-row'>
          <ArrowRightOnRectangleIcon className=' h-5 w-5 mr-4' />
          <button onClick={handleLogout}>Sign out</button>
        </li>
      </ul>
      
    </div>
  )
}

export default Sidenav