"use client"

import { usePathname } from "next/navigation"
import React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
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
}

// Map of abbreviations to full names
const labelMap: Record<string, string> = {
  "wfl": "Weight for Length",
  "wfa": "Weight for Age",
  "hfa": "Height for Age",
  "bfa": "BMI for Age",
  "hcfa": "Head Circumference for Age",
  "wfl0To2": "Weight for Length (0-2)",
  "hfa5To19": "Height for Age (5-19)",
  "bfa5To19": "BMI for Age (5-19)",
  "print-wfl": "Print Weight for Length",
  "print-wfa": "Print Weight for Age",
  "print-hfa": "Print Height for Age",
  "print-bfa": "Print BMI for Age",
  "print-hcfa": "Print Head Circumference for Age",
  "print-wfl0To2": "Print Weight for Length (0-2)",
  "print-hfa5To19": "Print Height for Age (5-19)",
  "print-bfa5To19": "Print BMI for Age (5-19)",
}

function getBreadcrumbs(pathname: string): BreadcrumbData[] {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs: BreadcrumbData[] = []

  // Always start with Dashboard
  breadcrumbs.push({ label: "Dashboard", href: "/user" })

  if (segments.length > 1) {
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]
      const href = "/" + segments.slice(0, i + 1).join("/")
      
      // Skip route groups like (withLayout)
      if (segment.startsWith("(") && segment.endsWith(")")) {
        continue
      }

      // Check if previous segment is "patients" - then this is a patient ID
      const isPatientId = segments[i - 1] === "patients" && 
        !["add-patient", "edit-patient"].includes(segment)
      
      // Check if we're after a patient ID and this looks like an appointment ID
      // (not a known route like charts, vaccines, reports, etc.)
      const knownRoutes = [
        "charts", "vaccines", "reports", "receipts", "scrybegpt",
        "add-record", "edit-patient", "hfa", "wfa", "bfa", "hcfa", "wfl",
        "print-hfa", "print-wfa", "print-bfa", "print-hcfa", "print-wfl",
        "print-hfa5To19", "print-bfa5To19", "print-wfl0To2",
        "hfa5To19", "bfa5To19", "wfl0To2",
        "create-receipt", "create-report", "add-record", "print"
      ]
      const prevSegment = segments[i - 1]
      const isAppointmentId = !knownRoutes.includes(segment) && 
        !segment.startsWith("print-") &&
        !segment.startsWith("edit-") &&
        !segment.startsWith("add-") &&
        !segment.startsWith("create-") &&
        segments.some((s, idx) => s === "patients" && idx < i - 1)

      // Format the label
      let label = segment
      if (!isPatientId && !isAppointmentId) {
        // Check if we have a mapped label for this segment
        if (labelMap[segment]) {
          label = labelMap[segment]
        } else {
          // Capitalize and format the segment
          label = segment
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        }
      }

      breadcrumbs.push({
        label,
        href,
        ...(isPatientId ? { patientId: segment } : {}),
        ...(isAppointmentId ? { appointmentId: segment } : {}),
      })
    }
  }

  return breadcrumbs
}

// Component to render a breadcrumb item with patient/appointment title lookup
function DynamicBreadcrumbItem({
  crumb,
  isLast,
}: {
  crumb: BreadcrumbData
  isLast: boolean
}) {
  // Fetch patient name if this is a patient ID breadcrumb
  const patient = useQuery(
    api.patients.getById,
    crumb.patientId ? { patientId: crumb.patientId as Id<"patients"> } : "skip"
  )

  // Fetch appointment info if this is an appointment ID breadcrumb
  const appointment = useQuery(
    api.appointments.getById,
    crumb.appointmentId ? { appointmentId: crumb.appointmentId as Id<"appointments"> } : "skip"
  )

  // Determine the display label
  let displayLabel = crumb.label
  if (crumb.patientId && patient) {
    displayLabel = `${patient.firstname} ${patient.lastname}`
  } else if (crumb.appointmentId && appointment) {
    // Format appointment date
    const date = new Date(appointment.startDate)
    displayLabel = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLast) {
    return <BreadcrumbPage>{displayLabel}</BreadcrumbPage>
  }

  return <BreadcrumbLink href={crumb.href}>{displayLabel}</BreadcrumbLink>
}

export function BreadcrumbNav() {
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
