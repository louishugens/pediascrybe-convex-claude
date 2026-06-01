import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FlaskConical, AlertTriangle, Eye, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewTransition } from 'react'

export default function LabAttentionStat() {
  return (
    <Card className="glass card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Labs to review</CardTitle>
        <FlaskConical className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <ViewTransition>
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <LabAttentionContent />
          </Suspense>
        </ViewTransition>
      </CardContent>
    </Card>
  )
}

async function LabAttentionContent() {
  const doctor = await fetchAuthQuery(api.doctors.getCurrent)
  if (!doctor) return null

  const data = await fetchAuthQuery(api.appointments.getLabAttention, {
    doctorId: doctor._id,
    limit: 5,
  })

  if (!data || data.totalAttention === 0) {
    return (
      <p className="text-sm text-muted-foreground">No labs need your attention.</p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        {data.statCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {data.statCount} stat
          </Badge>
        )}
        {data.awaitingReviewCount > 0 && (
          <Badge variant="default" className="gap-1">
            <Eye className="h-3 w-3" />
            {data.awaitingReviewCount} to review
          </Badge>
        )}
      </div>

      <ul className="divide-y rounded-md border bg-card/40">
        {data.items.map((it) => (
          <li key={it.labOrderId}>
            <Link
              href={`/user/patients/${it.patientId}/labs` as any}
              className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{it.patientName}</div>
                <div className="text-xs text-muted-foreground truncate">{it.examName}</div>
              </div>
              {it.urgency === "stat" ? (
                <Badge variant="destructive" className="text-[10px]">stat</Badge>
              ) : it.status === "resulted" ? (
                <Badge variant="default" className="text-[10px]">resulted</Badge>
              ) : null}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      {data.totalAttention > data.items.length && (
        <Link
          href="/user/labs"
          className="block text-xs text-primary hover:underline pt-1"
        >
          See all {data.totalAttention} →
        </Link>
      )}
    </div>
  )
}
