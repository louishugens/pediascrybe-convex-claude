"use client"

import { usePathname } from "next/navigation"
import React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { format } from "date-fns"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface BreadcrumbData {
  label: string
  href: string
  patientId?: string
  appointmentId?: string
  appointmentPatientId?: string
}

function getBreadcrumbs(pathname: string): BreadcrumbData[] {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs: BreadcrumbData[] = []

  breadcrumbs.push({ label: "Portal", href: "/portal" })

  if (segments.length > 1) {
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]
      const href = "/" + segments.slice(0, i + 1).join("/")

      // Skip route groups
      if (segment.startsWith("(") && segment.endsWith(")")) continue

      // Check if this is a patient ID (previous segment is "children")
      const isPatientId = segments[i - 1] === "children" &&
        !["add", "edit"].includes(segment)

      // Check if this is an appointment ID (previous segment is "appointments")
      const isAppointmentId = segments[i - 1] === "appointments" &&
        !["add", "edit"].includes(segment)

      // Find the patient ID from earlier segments for appointment lookups
      let appointmentPatientId: string | undefined
      if (isAppointmentId) {
        const childrenIdx = segments.indexOf("children")
        if (childrenIdx >= 0 && childrenIdx + 1 < segments.length) {
          appointmentPatientId = segments[childrenIdx + 1]
        }
      }

      let label = segment
      if (!isPatientId && !isAppointmentId) {
        label = segment
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      }

      breadcrumbs.push({
        label,
        href,
        ...(isPatientId ? { patientId: segment } : {}),
        ...(isAppointmentId ? { appointmentId: segment, appointmentPatientId } : {}),
      })
    }
  }

  return breadcrumbs
}

function DynamicBreadcrumbItem({
  crumb,
  isLast,
}: {
  crumb: BreadcrumbData
  isLast: boolean
}) {
  const patient = useQuery(
    api.portal.getPatientDetails,
    crumb.patientId ? { patientId: crumb.patientId as Id<"patients"> } : "skip"
  )

  const appointment = useQuery(
    api.portal.getAppointmentDetail,
    crumb.appointmentId && crumb.appointmentPatientId
      ? {
          patientId: crumb.appointmentPatientId as Id<"patients">,
          appointmentId: crumb.appointmentId as Id<"appointments">,
        }
      : "skip"
  )

  let displayLabel = crumb.label
  if (crumb.patientId && patient) {
    displayLabel = `${patient.firstname} ${patient.lastname}`
  } else if (crumb.appointmentId && appointment) {
    displayLabel = format(new Date(appointment.startDate), "MMM d, yyyy")
  }

  if (isLast) {
    return <BreadcrumbPage>{displayLabel}</BreadcrumbPage>
  }

  return <BreadcrumbLink href={crumb.href}>{displayLabel}</BreadcrumbLink>
}

export function PortalBreadcrumbNav() {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            {index > 0 && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
            <BreadcrumbItem
              className={
                index === breadcrumbs.length - 1 ? "" : "hidden md:block"
              }
            >
              <DynamicBreadcrumbItem
                crumb={crumb}
                isLast={index === breadcrumbs.length - 1}
              />
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
