import Link from "next/link"
import prisma from "../utils/prisma"
import { EyeIcon, PencilIcon, TrashIcon} from '@heroicons/react/24/outline'
import AppointmentComponent from "./appointment"

async function getAppointments(patientId){
  const patient = await prisma.appointment.findMany({
    where:{
      patientId: patientId
    },
    orderBy:{
      startDate: 'desc'
    },
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
      {appointments.map(appointment => <AppointmentComponent appointment={appointment} doctorId={doctorId} patientId={patientId} key={appointment._id} data-superjson />
        

      )}
    </tbody>
  </table>
  )
}

export default Appointments