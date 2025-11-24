import { verifySession } from '@/data/queries'
import { getMonthlyRevenue } from '@/db/queries'
import { Card, CardContent, CardTitle, CardHeader, CardFooter } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'
import { formatCurrency } from '@/utils/currency'

export default async function MonthlyRevenueStat() {
  return (
    <Card className="glass card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">This Month&apos;s Revenue</CardTitle>
        <TrendingUp className="h-4 w-4 text-green-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">
          <ViewTransition>
            <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full color-primary" />}>
              <MonthlyRevenueStatContent />
            </Suspense>
          </ViewTransition>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Revenue from this month&apos;s appointments</p>
      </CardFooter>
    </Card>
  )
}

async function MonthlyRevenueStatContent() {
  const user = await verifySession()
  if (!user) {
    return null
  }
  const { revenue, currency } = await getMonthlyRevenue(user.id)
  return formatCurrency(revenue, currency)
}

