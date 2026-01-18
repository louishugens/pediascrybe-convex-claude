"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

// import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
// import { Icons } from "@/components/icons"
// import { Badge } from "@/registry/new-york/ui/badge"

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="mr-4 flex ">
      <a href="https://pediascrybe.com" className="mr-6 flex items-center space-x-2">
        <Image src="/logo.svg" alt="Pediascrybe" width={20} height={20} className="w-auto h-6 object-contain" />
      </a>
    </div>
  )
}