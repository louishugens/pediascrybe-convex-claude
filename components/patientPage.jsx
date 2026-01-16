import React from 'react'
import Link from 'next/link'
import useDoctor from '../utils/hooks/useDoctor'

const PatientPage = () => {
  const doctor = useDoctor
  return (
    <div>
      <div className="flex flex-row w-full justify-between">
        <p className=' font-bold text-slate-900'><span className=' text-primary'>Patient list</span></p>
        <Link 
        className='self-end px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm' 
        href='/user_only/patients/add-patient'>Add Patient</Link>
      </div>
      {/* {doctor && <PatientList doctor={doctor} />} */}
      
    </div>
  )
}

export default PatientPage