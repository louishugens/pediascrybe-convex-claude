import Link from "next/link"
import prisma from "../utils/prisma"
import { format } from "date-fns"
import { EyeIcon, PencilIcon, TrashIcon} from '@heroicons/react/24/outline'

async function getAppointments(patientId){
  const patient = await prisma.appointment.findMany({
    where:{
      patientId: patientId
    },
    orderBy:{
      startDate: 'desc'
    },
    // include: {
    //   patients:{
    //     orderBy:{
    //       lastname: 'asc'
    //     }
    //   },
    // },
  })
  return patient
}

const Appointments = async ({doctorId, patientId}) => {
  const appointments = await getAppointments(patientId)
  return (
    <table className="table-auto color-0 rounded-lg relative text-sm w-full mt-4 border-separate border-spacing-y-1.5">
    <thead className="rounded-t-lg  bg-blue-50">
      <tr className="rounded-full shadow">
        <th className="text-left px-4 py-2 rounded-l-full">Date</th>
        <th className="text-left px-4 py-2">Height</th>
        <th className="text-left px-4 py-2">Weight</th>
        <th className="text-left px-4 py-2">Head Circumference</th>
        <th className="text-left px-4 py-2 rounded-r-full">Actions</th>
      </tr>
    </thead>
    <tbody className='w-full'>
      {appointments.map(appointment => (
        
        <tr key={appointment.id} className="border-b text-sm font-light w-full bg-slate-50 shadow pt-12 rounded-full border-none border-spacing-x-2">
          {/* <td className="px-4 py-1">{format(appointment.createdAt, 'E dd MMM yyyy  hh:mm:ss', { locale: fr })}</td>  */}
          <td className="px-4 py-2 rounded-l-full mt-2">{format(appointment.startDate, 'yyy-MM-dd hh:mm:ss')}</td>
          <td className="px-4 py-2">{appointment.height} cm</td>
          <td className="px-4 py-2">{appointment.weight} kg</td>
          <td className="px-4 py-2">{appointment.head} cm</td>
          <td className="px-4 py-2 rounded-r-full">
            <div className="flex flex-row justify-start">
              <Link href={`/user_only/${doctorId}/patients/${patientId}/${appointment.id}`} className="mr-2">
                <EyeIcon className="h-4 w-4" />
              </Link>
              <Link href={`/user_only/${doctorId}/patients/${patientId}/${appointment.id}`} className="mr-2">
                <PencilIcon className="h-4 w-4" />
              </Link>
              <Link href={`/user_only/${doctorId}/patients/${patientId}/${appointment.id}`}>
                <TrashIcon className="h-4 w-4" />
              </Link>
            </div>

          </td>
          {/* <td className="px-4 py-1"> */}
          {/* <Link href="/user_only/[companyId]/sales/[saleId]" as={`/user_only/${company.id}/sales/${sale.id}`} className="color-0-bg text-sm text-white px-2 pz-1 rounded-full">
            Voir Article
          </Link> */}
          {/* </td> */}
        </tr>
      ))}
    </tbody>
  </table>
  )
}

export default Appointments