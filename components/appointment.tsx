'use client'
import Link from 'next/link'
import { EyeIcon, PencilIcon, TrashIcon} from 'lucide-react'
import { Loader2Icon} from 'lucide-react'
import { format } from "date-fns"
import {useRouter} from 'next/navigation'
import {BeatLoader} from 'react-spinners'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from './ui/dialog'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { deleteAppointment } from '@/app/actions'
import { AppointmentSelect } from '@/db/schema'


const AppointmentComponent = ({appointment, patientId}: {appointment: AppointmentSelect, patientId: string}) => {
  const [loading, setLoading] = useState(false)
  let [color, setColor] = useState("#22C55E")

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
            <DeleteAppointmentDialog appointmentId={appointment.id} patientId={patientId} />
          </div>
        }
      </td>
    </tr>
  )
}

export default AppointmentComponent


function DeleteAppointmentDialog({ appointmentId, patientId }: { appointmentId: string, patientId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={null} className=" bg-transparent hover:bg-transparent text-black rounded-full text-sm" >
          <TrashIcon className="w-4 h-4 text-red-500 hover:scale-110 transition-all duration-300" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Appointment</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this appointment?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => {
              setLoading(false)
            }} disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={async () => {
            setLoading(true)
            const res = await deleteAppointment(appointmentId, patientId)
            setLoading(false)
            if (res.success) {
              toast.success('Appointment deleted successfully')
              setOpen(false)
              // router.refresh()
              // router.push(`/user/patients/${patientId}`)
            } else {
              toast.error(res.error)
              setLoading(false)
            }
          }} disabled={loading}>
            {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4 text-white" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}