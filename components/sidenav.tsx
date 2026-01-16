'use client'
import Link from 'next/link'
import React from 'react'
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeftOnRectangleIcon, ListBulletIcon, PencilIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { authClient } from '@/lib/auth-client';

const Sidenav = () => {

  const router = useRouter()
  const pathname = usePathname();

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/')
  }


  return (
   <div className='h-full w-64  bg-primary/5 shadow sticky px-8'>
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