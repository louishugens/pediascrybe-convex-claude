"use client"
import * as React from "react"
import Link, { LinkProps } from "next/link"
import { useRouter } from "next/navigation"

// import { docsConfig } from "@/config/docs"
// import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
// import { Icons } from "@/components/icons"
import { Button }  from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { Bars3BottomRightIcon } from '@heroicons/react/24/solid'



export function MobileNav() {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Bars3BottomRightIcon className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="pr-0">
        <MobileLink
          href={"/" as any}
          className="flex items-center"
          onOpenChange={setOpen}
        >
          <span className="font-bold text-primary italic">Pediascrybe</span>
        </MobileLink>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
            <MobileLink
              href={"/contact" as any}
              onOpenChange={setOpen}
            >
              Contact
            </MobileLink>
            <MobileLink
              href={"/" as any}
              onOpenChange={setOpen}
              className="text-sm text-primary w-fit border border-primary bg-muted px-4 py-1 rounded-full"
            >
              Signin
            </MobileLink>
            {/* Signup removed — standalone deployment blocks new registrations */}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

interface MobileLinkProps extends LinkProps<string> {
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  ...props
}: MobileLinkProps) {
  const router = useRouter()
  return (
    <Link
      href={href}
      onClick={() => {
        router.push(href.toString() as any)
        onOpenChange?.(false)
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </Link>
  )
}