import Link from 'next/link'
import prisma from '@/utils/prisma';
// import {createServerClient} from '@/utils/supabase-server'
import supabase from '@/utils/supabase-ssr'

async function getDoctor(doctorId){
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
    // include:{
    //   patients: true,
    // },
  })
  return doctor
}

export const dynamic = 'force-dynamic';

const ProfilePage = async () => {
  // const supabase = createServerClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const doctorId = session?.user?.id
  const doctor = await getDoctor(doctorId)
  return (
    <div className='flex flex-col w-full'>
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 ">
        <div className="flex flex-row w-full justify-between">
          <p className=' font-light text-slate-900'>Dr <span className=' font-bold '>{doctor.firstname} {doctor.lastname}</span></p>
          <Link 
          className='self-end px-4 py-2 bg-blue-500 text-white rounded-full text-sm' 
          href={`/user/edit-profile`}>Edit Profile</Link>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {/* <p className="text-sm">Birth date: <span className="font-bold">{format(new Date(patient.birthdate), 'dd-MM-yyyy')}</span></p> */}
          {/* <p className="text-sm">Sex: <span className="font-bold">{doctor.sex}</span></p> */}
          <p className="text-sm font-semibold">Email: <span className="font-normal">{doctor.email}</span></p>
          <p className="text-sm font-semibold">Phone: <span className="font-normal">{doctor.phone}</span></p>
          <p className="text-sm font-semibold">Specialty: <span className="font-normal">{doctor.spec}</span></p>
          <p className="text-sm font-semibold col-span-2">Address: <span className="font-normal">{doctor.address}</span></p>

        </div>
      </div>
    </div>
  )
}

export default ProfilePage