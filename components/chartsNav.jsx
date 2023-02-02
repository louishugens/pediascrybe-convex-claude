'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ChartsNav = ({doctorId, patientId, }) => {
  const pathname = usePathname()
  return (
    <div className='flex flex-row w-full h-auto gap-4'>
    <Link href={`/user_only/${doctorId}/patients/${patientId}`} className="mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start">Leave</Link>
    <Link href={`/user_only/${doctorId}/patients/${patientId}/charts`} className={pathname === (`/user_only/${doctorId}/patients/${patientId}/charts`) ? "mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start" : "mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start"}>Weight for Age</Link>
    <Link href={`/user_only/${doctorId}/patients/${patientId}/charts/wfl`} className={pathname === (`/user_only/${doctorId}/patients/${patientId}/charts/wfl`) ? "mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start" : "mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start"}>Weight for Lenght</Link>
    <Link href={`/user_only/${doctorId}/patients/${patientId}/charts/bmifa`} className={pathname === (`/user_only/${doctorId}/patients/${patientId}/charts/bmifa`) ? "mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start" : "mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start"}>BMI for Age</Link>
    <Link href={`/user_only/${doctorId}/patients/${patientId}/charts/headfa`} className={pathname === (`/user_only/${doctorId}/patients/${patientId}/charts/headfa`) ? "mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start" : "mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start"}>Head Circ. for Age</Link>
  </div>
  )
}

export default ChartsNav