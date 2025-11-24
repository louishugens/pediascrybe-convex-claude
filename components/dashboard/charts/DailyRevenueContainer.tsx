import { verifySession } from '@/data/queries'
import { getDailyRevenueData } from '@/db/queries'
import { DailyRevenueChart } from './DailyRevenueChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'

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
  const user = await verifySession()
  if (!user) {
    return null
  }
  const data = await getDailyRevenueData(user.id, false) // Get all time data, filtering happens client-side
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

