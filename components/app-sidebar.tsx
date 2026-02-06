"use client"

import * as React from "react"
import {
  Users,
  UserPlus,
  User,
  PenSquare,
  CalendarDays,
  LayoutDashboard,
  Settings,
  Video,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const baseNavItems = [
  {
    title: "Dashboard",
    url: "/user",
    icon: LayoutDashboard,
  },
  {
    title: "Patients",
    url: "/user/patients",
    icon: Users,
  },
  {
    title: "Add Patient",
    url: "/user/add-patient",
    icon: UserPlus,
  },
  {
    title: "Profile",
    url: "/user/profile",
    icon: User,
  },
  {
    title: "Edit Profile",
    url: "/user/edit-profile",
    icon: PenSquare,
  },
]

const telehealthNavItems = [
  {
    title: "Availability",
    url: "/user/telehealth/availability",
    icon: CalendarDays,
    feature: "telehealth",
  },
  {
    title: "Appointments",
    url: "/user/telehealth/appointments",
    icon: Video,
    feature: "telehealth",
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/user">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/icon-blue.png"
                    alt="Pediascrybe"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-primary">
                    Pediascrybe
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Medical Records
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={baseNavItems} />
        <NavMain items={telehealthNavItems} label="Telehealth" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
