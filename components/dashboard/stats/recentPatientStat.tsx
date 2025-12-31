import { Card, CardContent, CardTitle, CardHeader, CardFooter } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'
import { getCurrentDoctor } from '@/lib/convex-data'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export default async function RecentPatientStat() {
  return (
    <Card className="glass card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Recent Patients</CardTitle>
        <Users className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">
          <ViewTransition>
            <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full color-primary" />}>
              <RecentPatientStatContent />
            </Suspense>
          </ViewTransition>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Patients registered in the last 30 days</p>
      </CardFooter>
    </Card>
  )
}

async function RecentPatientStatContent() {
  const doctor = await getCurrentDoctor()
  if (!doctor) {
    return null
  }
  const patients = await fetchAuthQuery(api.patients.getRecentPatients, { 
    doctorId: doctor._id 
  })
  return patients?.length ?? 0
}
