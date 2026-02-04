import { AgeDistributionChart } from './AgeDistributionChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'
import { getCurrentDoctor } from '@/lib/convex-data'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export default async function AgeDistributionContainer() {
    return (
    <ViewTransition>
      <Suspense fallback={<AgeDistributionSkeleton />}>
        <AgeDistributionContent/>
      </Suspense>
    </ViewTransition>
  )
}

async function AgeDistributionContent() {
  const doctor = await getCurrentDoctor()
  if (!doctor) {
    return null
  }
  const patients = await fetchAuthQuery(api.patients.getPatients, { doctorId: doctor._id })
  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Age Distribution</CardTitle>
        <CardDescription>Distribution of patients by age groups</CardDescription>
      </CardHeader>
      <CardContent>
        <AgeDistributionChart patients={patients} />
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Age distribution among all the patients</p>
      </CardFooter>
    </Card>
  )
}

function AgeDistributionSkeleton() {
  const ageRanges = ["0-2", "3-5", "6-8", "9-11", "12-14", "15-17", "18+"]
  const barHeights = ["h-48", "h-28", "h-12", "h-20", "h-24", "h-16", "h-32"]
  
  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Age Distribution</CardTitle>
        <CardDescription>Distribution of patients by age groups</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px] flex flex-col justify-end p-4">
          <div className="flex items-end justify-between gap-4 h-full">
            {ageRanges.map((range, index) => (
              <div key={range} className="flex flex-col items-center flex-1 h-full justify-end gap-2">
                <Skeleton className={`w-full ${barHeights[index]} rounded-t-lg bg-primary/20`} />
                <span className="text-xs text-muted-foreground font-medium">{range}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Age distribution among all the patients</p>
      </CardFooter>
    </Card>
  )
}
