import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardTitle, CardHeader, CardFooter } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'

export default async function TodayPatientsStat() {
  return (
    <Card className="glass card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Today&apos;s Patients</CardTitle>
        <Users className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">
          <ViewTransition>
            <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full color-primary" />}>
              <TodayPatientsStatContent />
            </Suspense>
          </ViewTransition>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Unique patients seen today</p>
      </CardFooter>
    </Card>
  )
}

async function TodayPatientsStatContent() {
  const doctor = await fetchAuthQuery(api.doctors.getCurrent)
  if (!doctor) {
    return null
  }
  const count = await fetchAuthQuery(api.appointments.getTodayPatientCount, { doctorId: doctor._id })
  return count
}

