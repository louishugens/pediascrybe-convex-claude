import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardTitle, CardHeader, CardFooter } from '@/components/ui/card'
import { Stethoscope } from 'lucide-react'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'


export default async function TotalConsultationStat() {
  return (
    <Card className="glass card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
        <Stethoscope className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">
          <ViewTransition>
            <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full color-primary" />}>
              <TotalConsultationStatContent />
            </Suspense>
          </ViewTransition>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Consultations from start of service</p>
      </CardFooter>
    </Card>
  )
}

async function TotalConsultationStatContent() {
  const doctor = await fetchAuthQuery(api.doctors.getCurrent)
  if (!doctor) {
    return null
  }
  const appointments = await fetchAuthQuery(api.appointments.listByDoctor, { doctorId: doctor._id })
  return appointments.length
}

