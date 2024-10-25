'use client'

import { TrashIcon, Loader2Icon } from "lucide-react";
import { deleteVaccinationRecord } from "@/app/actions";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function VaccineRecordDeleteButton({ recordId, patientId }: { recordId: string, patientId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  return (
    <div className="flex items-center justify-center cursor-pointer" onClick={async () => {
      setIsDeleting(true)
      const res = await deleteVaccinationRecord(recordId, patientId)
      setIsDeleting(false)
      if (res.success) {
        toast.success('Vaccination record deleted successfully')

      } else {
        toast.error(res.error)

      }
      router.push(`/user/patients/${patientId}/vaccines`)
    }}>
      {isDeleting ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
    </div>
  )
}
