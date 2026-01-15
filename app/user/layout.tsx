import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ClientAuthBoundary } from "@/lib/auth-client"

interface LayoutProps {
  children: React.ReactNode
}

function SidebarSkeleton() {
  return (
    <div className="flex h-full w-(--sidebar-width) flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex-1 space-y-2 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 rounded bg-muted animate-pulse" />
        ))}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <ClientAuthBoundary>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4 self-center!" />
              <span className="text-sm text-muted-foreground">Dashboard</span>
            </header>
            <div className="flex-1 p-4 overflow-x-hidden">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ClientAuthBoundary>
    </Suspense>
  )
}

export default Layout
