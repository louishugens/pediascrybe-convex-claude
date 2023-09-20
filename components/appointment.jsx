'use client'
import Link from 'next/link'
import { EyeIcon, PencilIcon, TrashIcon} from '@heroicons/react/24/outline'
import { format } from "date-fns"
import {useRouter} from 'next/navigation'
import {BeatLoader} from 'react-spinners'
import { useState } from 'react'

const AppointmentComponent = ({appointment, doctorId, patientId}) => {
  const [loading, setLoading] = useState(false)
  let [color, setColor] = useState("#22C55E")

  const router = useRouter()
  const handleDelete = async () =>{
    if(window.confirm('Are you sure you want to delete appointment?')){
      try{
        setLoading(true)
        const body = {appointmentId: appointment.id}
        await fetch('/api/patients/deleteAppointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        router.refresh()
        router.push(`/user/patients/${patientId}`)
      }
      catch(err){
        console.log(err)
      }
    }
  }
  return (
    <tr key={appointment.id} className="border-b text-sm font-light w-full bg-slate-50 shadow pt-12 rounded-full border-none border-spacing-x-2">
      <td className="px-4 py-2 rounded-l-full mt-2">{format(appointment.startDate, 'yyy-MM-dd hh:mm:ss')}</td>
      <td className="px-4 py-2">{appointment.height} cm</td>
      <td className="px-4 py-2">{appointment.weight} kg</td>
      <td className="px-4 py-2">{appointment.head} cm</td>
      <td className="px-4 py-2 rounded-r-full">
        {
          loading
          ?
          <BeatLoader
            color={color}
            size={10}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
          :
          <div className="flex flex-row justify-start">
            <Link href={`/user/patients/${patientId}/${appointment.id}`} className="mr-2">
              <EyeIcon className="h-4 w-4" />
            </Link>
            <Link href={`/user/patients/${patientId}/${appointment.id}/edit-appointment`} className="mr-2">
              <PencilIcon className="h-4 w-4" />
            </Link>
            <button onClick={handleDelete}>
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        }
      </td>
    </tr>
  )
}

export default AppointmentComponent