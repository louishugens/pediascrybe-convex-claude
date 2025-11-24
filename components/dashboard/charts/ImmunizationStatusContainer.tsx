import { verifySession } from '@/data/queries'
import { ImmunizationStatusChart } from '@/components/dashboard/charts/ImmunizationStatusChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getPatientsWithVaccinationRecords } from '@/data/queries'
import { ViewTransition } from 'react'

export default async function ImmunizationStatusContainer() {

  return (
    <ViewTransition>
      <Suspense fallback={<ImmunizationStatusSkeleton />}>
        <ImmunizationStatusContent/>
      </Suspense>
    </ViewTransition>
  )
}

async function ImmunizationStatusContent() {
  const user = await verifySession()
  if (!user) {
    return null
  }
  const patients = await getPatientsWithVaccinationRecords(user.id)

  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Immunization Status</CardTitle>
        <CardDescription>Immunization completion status</CardDescription>
      </CardHeader>
      <CardContent>
        <ImmunizationStatusChart patients={patients} />
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Immunization completion status among all the patients</p>
      </CardFooter>
    </Card>
  )
}

function ImmunizationStatusSkeleton() {
  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Immunization Status</CardTitle>
        <CardDescription>Immunization completion status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="relative aspect-square max-h-[200px] w-full max-w-[200px]">
            <Skeleton className="h-full w-full rounded-full bg-green-700/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-36 w-36 rounded-full bg-background" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Immunization completion status among all the patients</p>
      </CardFooter>
    </Card>
  )
}

