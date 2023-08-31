"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
// import { Icons } from "@/components/icons"
// import { Badge } from "@/registry/new-york/ui/badge"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 flex ">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="text-xl font-bold sm:inline-block text-primary italic">
          Pediascrybe
        </span>
      </Link>
    </div>
  )
}