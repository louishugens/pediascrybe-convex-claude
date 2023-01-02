import "server-only";
import prisma from "../../../../utils/prisma"
import Link from 'next/link'
import PatientList from '../../../../components/patientList'



// export const revalidate = 10; 

async function getDoctor(doctorId){
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
    // orderBy:{
    //   lastname: 'asc'
    // }
    include: {
      patients:{
        orderBy:{
          lastname: 'asc'
        }
      },
    },
  })
  return doctor
  // const res = fetch(`/api/doctor/${doctorId}`)
  // if(!res.ok){
  //   throw new Error('Unable to fetch data')
  // }
  // return res.json()
}

// export const dynamic = 'force-dynamic',
//   revalidate = 0;

export default async function Patients({ params: { doctorId }}) {

  const {patients} = await getDoctor(doctorId)


  return (
    <div className='pl-4 h-full'>
      <div className="flex flex-row w-full justify-between">
        <p className=' font-bold text-slate-900'><span className=' text-green-500'>Patient list</span></p>
        <Link 
        className='self-end px-4 py-2 bg-green-500 rounded-full text-sm' 
        href={`/user_only/${doctorId}/patients/add-patient`}>Add Patient</Link>
      </div>
      <PatientList patients={patients} />
      {/* <div className="flex flex-row w-full h-full">
        {
          patients.map((patient) => (
            <div className="basis-1/3 h-16" key={patient.id}>
              <p>{patient.firstname}</p>

            </div>
          )
          )
        }
      </div> */}
    </div>
  )
}
