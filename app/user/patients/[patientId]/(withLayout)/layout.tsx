import { Suspense } from "react";
import { ViewTransition } from "react";
import PatientSidebar from "@/components/patient/patient-sidebar";
import { Skeleton } from "@/components/ui/skeleton";

type Params = Promise<{ patientId: string }>

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Demographics Preview Skeleton */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-9 w-full mt-4 rounded-full" />
      </div>
      
      {/* Quick Actions Skeleton */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
      
      {/* Scrybe Input Skeleton */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) => {
  return (
    <div className="flex gap-6 w-full relative">
      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-x-clip">
        <ViewTransition>
          {children}
        </ViewTransition>
      </div>
      
      {/* Sidebar - sticky positioning to stay visible while scrolling */}
      <aside className="hidden lg:block w-[320px] shrink-0">
        <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4">
          <Suspense fallback={<SidebarSkeleton />}>
            <PatientSidebar params={params} />
          </Suspense>
        </div>
      </aside>
    </div>
  )
}

export default Layout
