import Link from 'next/link'
import React from 'react'

const Patients = () => {
  return (
    <div className='pl-4'>
      <div className="flex flex-row w-full justify-between">
        <p className=' font-bold text-slate-900'><span className=' text-green-500'>Patient list</span></p>
        <Link className='self-end px-4 py-2 bg-green-500 rounded-full text-sm' href='/user_only/patients/add-patient'>Add Patient</Link>
      </div>
    </div>
  )
}

export default Patients