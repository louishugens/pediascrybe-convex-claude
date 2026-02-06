"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useParams, useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDistanceToNow } from "date-fns"

export function ChildSwitcher() {
  const patients = useQuery(api.portal.getMyPatients)
  const params = useParams()
  const router = useRouter()
  const currentPatientId = params?.patientId as string | undefined

  if (!patients || patients.length <= 1) return null

  return (
    <Select
      value={currentPatientId}
      onValueChange={(value) => {
        if (value !== currentPatientId) {
          router.push(`/portal/children/${value}`)
        }
      }}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select child" />
      </SelectTrigger>
      <SelectContent>
        {patients.map((child) => {
          if (!child) return null
          const age = child.birthdate
            ? formatDistanceToNow(new Date(child.birthdate), { addSuffix: false })
            : ""
          return (
            <SelectItem key={child._id} value={child._id}>
              {child.firstname} {child.lastname} {age ? `(${age})` : ""}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
