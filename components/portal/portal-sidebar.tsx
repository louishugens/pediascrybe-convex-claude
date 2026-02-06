"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Settings,
  Bell,
  Sparkles,
  Video,
  CalendarPlus,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronsUpDown, LogOut } from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    url: "/portal",
    icon: LayoutDashboard,
  },
  {
    title: "My Children",
    url: "/portal/children",
    icon: Users,
  },
  {
    title: "Notifications",
    url: "/portal/notifications",
    icon: Bell,
  },
  {
    title: "Settings",
    url: "/portal/settings",
    icon: Settings,
  },
]

const telehealthItems = [
  {
    title: "Book Appointment",
    url: "/portal/telehealth/book",
    icon: CalendarPlus,
  },
  {
    title: "My Appointments",
    url: "/portal/telehealth/appointments",
    icon: Video,
  },
]

export function PortalSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { data: session } = authClient.useSession()
  const user = session?.user
  const unreadCount = useQuery(api.portal.getUnreadNotificationCount)
  const subscription = useQuery(api.patientSubscriptions.getMySubscription)
  const isPremium =
    subscription?.plan === "premium" &&
    (subscription?.status === "active" || subscription?.status === "trialing")

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName = user?.name || user?.email || "User"
  const email = user?.email || ""
  const avatar = user?.image || ""

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/portal">
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
                    Parent Portal
                  </span>
                </div>
                {isPremium && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 bg-primary/10 text-primary border-primary/20">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive =
                item.url === "/portal"
                  ? pathname === "/portal"
                  : pathname?.startsWith(item.url)

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                  >
                    <Link href={item.url as any}>
                      <item.icon />
                      <span>{item.title}</span>
                      {item.title === "Notifications" && unreadCount && unreadCount > 0 ? (
                        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0.5 min-w-5 text-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
        {/* Telehealth Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Telehealth</SidebarGroupLabel>
          <SidebarMenu>
            {telehealthItems.map((item) => {
              const isActive = pathname?.startsWith(item.url)
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                  >
                    <Link href={item.url as any}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatar} alt={displayName} />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs">{email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={avatar} alt={displayName} />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className="truncate text-xs">{email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/portal/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
