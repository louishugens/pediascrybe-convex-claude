import { CommonConditionsChart } from '@/components/dashboard/charts/CommonConditionsChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'
import { getCurrentDoctor } from '@/lib/convex-data'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export default async function CommonConditionsContainer() {
  return (
    <ViewTransition>
      <Suspense fallback={<CommonConditionsSkeleton />}>
        <CommonConditionsContent/>
      </Suspense>
    </ViewTransition>
  )
}

async function CommonConditionsContent() {
  const doctor = await getCurrentDoctor()
  if (!doctor) {
    return null
  }
  const appointments = await fetchAuthQuery(api.appointments.getAppointments, { 
    doctorId: doctor._id 
  })
  
  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Common Conditions</CardTitle>
        <CardDescription>Most frequent diagnoses</CardDescription>
      </CardHeader>
      <CardContent>
        <CommonConditionsChart appointments={appointments} />
      </CardContent>
    </Card>
  )
}

function CommonConditionsSkeleton() {
  const conditions = ["Condition 1", "Condition 2", "Condition 3", "Condition 4", "Condition 5"]
  const barWidths = ["w-4/5", "w-3/5", "w-2/5", "w-1/3", "w-1/4"]
  
  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Common Conditions</CardTitle>
        <CardDescription>Most frequent diagnoses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex flex-col justify-center gap-4 p-4">
          {conditions.map((condition, index) => (
            <div key={condition} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground font-medium w-32 text-left truncate">
                {condition}
              </span>
              <Skeleton className={`h-8 ${barWidths[index]} rounded bg-green-700/20`} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
