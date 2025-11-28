'use client'
import { Loader2Icon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { deletePatient } from '@/app/actions'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '../ui/dialog'
import { useRouter } from 'next/navigation'

export default function DeletePatientButton({ patientId }: { patientId: string }) {
  return (
    <DeletePatientDialog patientId={patientId} />
  )
}

function DeletePatientDialog({ patientId }: { patientId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size={null} className="px-4 py-1 bg-red-500 text-white rounded-full text-sm" >
          {isDeleting ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
          Delete Patient
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Patient</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this patient?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => {
              setIsDeleting(false)
            }} disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={async () => {
            setIsDeleting(true)
            const res = await deletePatient(patientId)

            if (res.success) {
              setOpen(false)
              toast.success(res.message)
              router.refresh()
              router.push('/user/patients')
            } else {
              toast.error(res.error)
              setIsDeleting(false)
            }
          }} disabled={isDeleting}>
            {isDeleting ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}