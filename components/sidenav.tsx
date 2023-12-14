'use client'
import { redirect } from 'next/navigation';
import Link from 'next/link'
import React from 'react'
import supabase from '../utils/supabase';
import { useRouter, usePathname } from 'next/navigation';
import useDoctor from '../utils/hooks/useDoctor';
import { ArrowLeftOnRectangleIcon, ListBulletIcon, PencilIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { refresh } from '@/app/actions';

const Sidenav = () => {

  const router = useRouter()
  const pathname = usePathname();

  const handleLogout = async () =>{
    const {error} = await supabase.auth.signOut()
    refresh(['/'])
    router.refresh()
    !error && router.push('/')
  }


  return (
   <div className='h-full w-64  bg-green-50 shadow sticky px-8'>
      <div className="pt-4">
        <Link href="/user">
          <p className='text-xl font-bold  text-primary italic'>Pediascrybe</p>
        </Link>
      </div>
      <ul className='pt-16 text-sm text-slate-900'>
        <li className={pathname?.includes(`/user/patients`) ? 'font-bold pb-2  flex flex-row': 'pb-2  flex flex-row'}>
          <UserGroupIcon className=' h-5 w-5 mr-4' />
          <Link href="/user/patients">Patients</Link>
        </li>
        <li className={pathname === (`/user/add-patient`) ? 'font-bold pb-2 flex flex-row' :'pb-2  flex flex-row'}>
          <UserPlusIcon className=' h-5 w-5 mr-4' />
          <Link href='/user/add-patient'>Add Patient</Link>
        </li>
        {/* <li className=' pb-2 '>
          <Link href='/user/appointments'>Appointments</Link>
        </li> */}
        <li className={pathname === (`/user/profile`) ? 'font-bold pb-2  flex flex-row' : ' pb-2  flex flex-row'}>
          <ListBulletIcon className=' h-5 w-5 mr-4'/>
          <Link href="/user/profile">Profile</Link>
        </li>
        <li className={pathname === (`/user/edit-profile`) ? 'font-bold pb-2  flex flex-row' :' pb-2  flex flex-row'}>
          <PencilIcon className=' h-5 w-5 mr-4' />
          <Link href="/user/edit-profile">Edit Profile</Link>
        </li>
        <li className=' pb-2  flex flex-row'>
          <ArrowLeftOnRectangleIcon className=' h-5 w-5 mr-4' />
          <button onClick={handleLogout}>Sign out</button>
        </li>
      </ul>
      
    </div>
  )
}

export default Sidenav