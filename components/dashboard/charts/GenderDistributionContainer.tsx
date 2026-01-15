import { GenderDistributionChart } from '@/components/GenderDistributionChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'
import { getCurrentDoctor } from '@/lib/convex-data'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export default async function GenderDistributionContainer() {
  return (
    <ViewTransition>
      <Suspense fallback={<GenderDistributionSkeleton />}>
        <GenderDistributionContent/>
      </Suspense>
    </ViewTransition>
  )
}

async function GenderDistributionContent() {
  const doctor = await getCurrentDoctor()
  if (!doctor) {
    return null
  }
  const patients = await fetchAuthQuery(api.patients.getPatients, { doctorId: doctor._id })
  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Sex Distribution</CardTitle>
        <CardDescription>Distribution of patients by sex</CardDescription>
      </CardHeader>
      <CardContent>
        <GenderDistributionChart patients={patients} />
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Sex distribution among all the patients</p>
      </CardFooter>
    </Card>
  )
}

function GenderDistributionSkeleton() {
  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Sex Distribution</CardTitle>
        <CardDescription>Distribution of patients by sex</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="relative aspect-square max-h-[200px] w-full max-w-[200px]">
            <Skeleton className="h-full w-full rounded-full bg-primary/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-36 w-36 rounded-full bg-background" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Sex distribution among all the patients</p>
      </CardFooter>
    </Card>
  )
}
