'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  Users,
  Stethoscope,
  DollarSign,
  TrendingUp,
  Calendar,
  WifiOff,
} from 'lucide-react'
import { Card, CardContent, CardTitle, CardHeader, CardFooter, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { offlineDb } from '@/lib/offline/db'
import { formatCurrency } from '@/utils/currency'
import { AgeDistributionChart } from '@/components/dashboard/charts/AgeDistributionChart'
import { GenderDistributionChart } from '@/components/GenderDistributionChart'
import { DailyRevenueChart } from '@/components/dashboard/charts/DailyRevenueChart'
import type {
  CachedPatient,
  CachedAppointment,
  CachedDoctor,
} from '@/lib/offline/types'

interface DashboardData {
  doctor: CachedDoctor | null
  patients: CachedPatient[]
  appointments: CachedAppointment[]
}

export function OfflineDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    Promise.all([
      offlineDb.doctors.toArray(),
      offlineDb.patients.toArray(),
      offlineDb.appointments.toArray(),
    ])
      .then(([doctors, patients, appointments]) => {
        setData({
          doctor: doctors[0] ?? null,
          patients,
          appointments,
        })
      })
      .catch(() =>
        setData({ doctor: null, patients: [], appointments: [] })
      )
  }, [])

  if (!data) {
    return <DashboardSkeleton />
  }

  const { doctor, patients, appointments } = data

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const tomorrowStart = todayStart + 86400000
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const thirtyDaysAgo = Date.now() - 30 * 86400000

  const todayAppts = appointments.filter(
    (a) => a.startDate >= todayStart && a.startDate < tomorrowStart
  )
  const monthAppts = appointments.filter((a) => a.startDate >= monthStart)
  const recentAppts = appointments.filter((a) => a.startDate >= thirtyDaysAgo)
  const recentPatients = patients.filter((p) => p.createdAt >= thirtyDaysAgo)

  const todayRevenue = todayAppts.reduce((sum, a) => sum + (a.cost ?? 0), 0)
  const monthlyRevenue = monthAppts.reduce((sum, a) => sum + (a.cost ?? 0), 0)
  const todayPatientIds = new Set(todayAppts.map((a) => a.patientId))

  const currency = doctor?.cost != null ? 'XAF' : 'USD'

  // Daily revenue data for chart
  const revenueByDay = new Map<string, { revenue: number; currency: string }>()
  appointments.forEach((a) => {
    if (a.cost != null && a.cost > 0) {
      const date = new Date(a.startDate).toISOString().slice(0, 10)
      const existing = revenueByDay.get(date)
      revenueByDay.set(date, {
        revenue: (existing?.revenue ?? 0) + a.cost,
        currency: existing?.currency ?? currency,
      })
    }
  })
  const dailyRevenueData = Array.from(revenueByDay.entries())
    .map(([date, { revenue, currency: c }]) => ({ date, revenue, currency: c }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Recent appointments for the list
  const recentList = [...appointments]
    .sort((a, b) => b.startDate - a.startDate)
    .slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold mb-2">
            Hello{' '}
            {doctor && (
              <span className="text-primary">
                Dr. {doctor.firstname} {doctor.lastname}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Welcome to your dashboard</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full">
          <WifiOff className="h-3 w-3" />
          <span>Offline — cached data</span>
        </div>
      </div>

      {/* Row 1: Revenue + Today's patients */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(todayRevenue, currency)}
          footer="Revenue from today's appointments"
          icon={<DollarSign className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="This Month's Revenue"
          value={formatCurrency(monthlyRevenue, currency)}
          footer="Revenue from this month's appointments"
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Today's Patients"
          value={todayPatientIds.size}
          footer="Unique patients seen today"
          icon={<Users className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Row 2: Totals + Recent */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        <StatCard
          title="Total Patients"
          value={patients.length}
          footer="Patients registered from start of service"
          icon={<Users className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Total Records"
          value={appointments.length}
          footer="Records from start of service"
          icon={<Stethoscope className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Recent Records"
          value={recentAppts.length}
          footer="Records in the last 30 days"
          icon={<Stethoscope className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Daily Revenue Chart */}
      <div className="mt-4">
        <Card className="glass card-hover">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Daily Revenue</CardTitle>
            <CardDescription>Revenue per day from cached records</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyRevenueChart data={dailyRevenueData} />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-4">
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
        <Card className="glass card-hover">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Gender Distribution</CardTitle>
            <CardDescription>Distribution of patients by gender</CardDescription>
          </CardHeader>
          <CardContent>
            <GenderDistributionChart patients={patients as any} />
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground italic">Gender distribution among all the patients</p>
          </CardFooter>
        </Card>
      </div>

      {/* Recent lists */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {recentList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cached appointments.</p>
            ) : (
              <div className="space-y-3">
                {recentList.map((apt) => {
                  const patient = patients.find((p) => p._id === apt.patientId)
                  return (
                    <div key={apt._id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {patient
                            ? `${patient.firstname} ${patient.lastname}`
                            : 'Unknown patient'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(apt.startDate, 'MMM d, yyyy')}
                          {apt.motif && ` — ${apt.motif}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent patients cached.</p>
            ) : (
              <div className="space-y-3">
                {recentPatients
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p._id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {p.firstname} {p.lastname}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.sex && `${p.sex} · `}
                          Registered {format(p.createdAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  footer,
  icon,
}: {
  title: string
  value: string | number
  footer: string
  icon: React.ReactNode
}) {
  return (
    <Card className="glass card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{value}</div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">{footer}</p>
      </CardFooter>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
