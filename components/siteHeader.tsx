'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MainNav } from "@/components/mainNav"
import { MobileNav } from "@/components/mobileNav"

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="supports-backdrop-blur:bg-background/60 fixed top-0 z-50 w-full backdrop-blur">
      <div className="container px-8 md:px-16 flex h-14 items-center">
        <MainNav />
        <div className="flex flex-1 items-center  space-x-2 justify-end">
          <MobileNav />
          <nav className="hidden md:flex gap-x-4 items-center text-sm">
            <Link
              href="/contact"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/contact"
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              Contact
            </Link>
            <Link href="/" className="text-sm text-foreground border border-primary bg-muted px-4 py-1 rounded-full">
              Login
            </Link>
            <Link href={"/signup" as any} className="text-sm text-foreground bg-primary px-4 py-1 rounded-full">
              Sign Up
            </Link>
            {/* <ModeToggle /> */}
          </nav>
        </div>
      </div>
    </header>
  )
}