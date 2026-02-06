"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ChildCard } from "@/components/portal/child-card"
import { Spinner } from "@/components/ui/spinner"
import { Baby } from "lucide-react"

export default function ChildrenListPage() {
  const patients = useQuery(api.portal.getMyPatients)

  if (patients === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Children</h1>
        <p className="text-muted-foreground mt-1">View and manage your children&apos;s health records</p>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Baby className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No children linked yet</h2>
          <p className="text-muted-foreground">
            Ask your doctor to send you a portal invitation to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {patients.map((patient) => {
            if (!patient) return null
            return <ChildCard key={patient._id} patient={patient} />
          })}
        </div>
      )}
    </div>
  )
}
