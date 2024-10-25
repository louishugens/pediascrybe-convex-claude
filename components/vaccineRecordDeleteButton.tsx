'use client'

import { TrashIcon, Loader2Icon } from "lucide-react";
import { deleteVaccinationRecord } from "@/app/actions";
import { useState } from "react";


export default function VaccineRecordDeleteButton({ recordId, patientId }: { recordId: string, patientId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <div className="flex items-center justify-center cursor-pointer" onClick={async () => {
      setIsDeleting(true)
      await deleteVaccinationRecord(recordId, patientId)
      // setIsDeleting(false)
    }}>
      {isDeleting ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
    </div>
  )
}
