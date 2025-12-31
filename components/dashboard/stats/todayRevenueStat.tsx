import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardTitle, CardHeader, CardFooter } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'
import { formatCurrency } from '@/utils/currency'

export default async function TodayRevenueStat() {
  return (
    <Card className="glass card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
        <DollarSign className="h-4 w-4 text-green-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">
          <ViewTransition>
            <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full color-primary" />}>
              <TodayRevenueStatContent />
            </Suspense>
          </ViewTransition>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Revenue from today&apos;s appointments</p>
      </CardFooter>
    </Card>
  )
}

async function TodayRevenueStatContent() {
  const doctor = await fetchAuthQuery(api.doctors.getCurrent)
  if (!doctor) {
    return null
  }
  const { revenue, currency } = await fetchAuthQuery(api.appointments.getTodayRevenue, { doctorId: doctor._id })
  return formatCurrency(revenue, currency)
}

