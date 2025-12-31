import { DailyRevenueChart } from './DailyRevenueChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'
import { getCurrentDoctor } from '@/lib/convex-data'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export default async function DailyRevenueContainer() {
  return (
    <ViewTransition>
      <Suspense fallback={<DailyRevenueSkeleton />}>
        <DailyRevenueContent />
      </Suspense>
    </ViewTransition>
  )
}

async function DailyRevenueContent() {
  const doctor = await getCurrentDoctor()
  if (!doctor) {
    return null
  }
  const data = await fetchAuthQuery(api.appointments.getDailyRevenueData, { 
    doctorId: doctor._id 
  })
  return <DailyRevenueChart data={data} />
}

function DailyRevenueSkeleton() {
  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Daily Revenue</CardTitle>
        <CardDescription>Revenue trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}
