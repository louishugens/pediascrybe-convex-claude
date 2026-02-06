"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type LucideIcon } from "lucide-react"
import { useSubscriptionGuard } from "@/hooks/use-subscription-guard"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  feature?: string // If set, requires this feature to navigate
}

export function NavMain({
  items,
  label = "Navigation",
}: {
  items: NavItem[]
  label?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { requireFeature } = useSubscriptionGuard()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            item.url === "/user"
              ? pathname === "/user"
              : pathname?.includes(item.url)

          if (item.feature) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  onClick={() => {
                    if (requireFeature(item.feature!, item.title)) {
                      router.push(item.url as any)
                    }
                  }}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
              >
                <Link href={item.url as any}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
