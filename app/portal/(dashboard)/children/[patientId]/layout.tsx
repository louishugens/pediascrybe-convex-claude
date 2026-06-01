"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ChildSwitcher } from "@/components/portal/child-switcher"
import { cn } from "@/lib/utils"
import {
  User,
  Calendar,
  Syringe,
  TrendingUp,
  Upload,
  Pill,
  FlaskConical,
} from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { label: "Overview", href: "", icon: User },
  { label: "Appointments", href: "/appointments", icon: Calendar },
  { label: "Medications", href: "/medications", icon: Pill },
  { label: "Labs", href: "/labs", icon: FlaskConical },
  { label: "Vaccines", href: "/vaccines", icon: Syringe },
  { label: "Growth", href: "/growth", icon: TrendingUp },
  { label: "Uploads", href: "/uploads", icon: Upload },
]

export default function ChildLayout({ children }: LayoutProps) {
  const params = useParams()
  const pathname = usePathname()
  const patientId = params.patientId as string

  const patient = useQuery(api.portal.getPatientDetails, {
    patientId: patientId as Id<"patients">,
  })

  const basePath = `/portal/children/${patientId}`

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with child name and switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {patient ? `${patient.firstname} ${patient.lastname}` : "Loading..."}
          </h1>
        </div>
        <ChildSwitcher />
      </div>

      {/* Sub Navigation */}
      <nav className="flex gap-1 border-b border-border overflow-x-auto pb-px">
        {navItems.map((item) => {
          const href = `${basePath}${item.href}`
          const isActive = item.href === ""
            ? pathname === basePath
            : pathname?.startsWith(href)

          return (
            <Link
              key={item.label}
              href={href as any}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                isActive
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
