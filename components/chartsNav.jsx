'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ChartsNav = ({ patientId, }) => {
  const pathname = usePathname()
  return (
    <div className='flex flex-row w-full h-auto gap-4'>
    <Link href={`/user/patients/${patientId}`} className="mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start">Leave</Link>
    <Link href={`/user/patients/${patientId}/charts`} className={pathname === (`/user/patients/${patientId}/charts`) ? "mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start" : "mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start"}>Weight for Age</Link>
    <Link href={`/user/patients/${patientId}/charts/hfa`} className={pathname === (`/user/patients/${patientId}/charts/hfa`) ? "mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start" : "mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start"}>Heigth for Age</Link>
    <Link href={`/user/patients/${patientId}/charts/wfl`} className={pathname === (`/user/patients/${patientId}/charts/wfl`) ? "mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start" : "mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start"}>Weight for Heigth</Link>
    <Link href={`/user/patients/${patientId}/charts/bfa`} className={pathname === (`/user/patients/${patientId}/charts/bfa`) ? "mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start" : "mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start"}>BMI for Age</Link>
    <Link href={`/user/patients/${patientId}/charts/hcfa`} className={pathname === (`/user/patients/${patientId}/charts/hcfa`) ? "mt-4 text-sm bg-blue-500 text-slate-100 rounded-full px-4 py-2 self-start" : "mt-4 text-sm text-blue-500 bg-slate-100 rounded-full px-4 py-2 self-start"}>Head Circ. for Age</Link>
  </div>
  )
}

export default ChartsNav