'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { offlineDb } from '@/lib/offline/db'
import type { CachedDoctor, CachedService, CachedVaccin } from '@/lib/offline/types'
import { Skeleton } from '@/components/ui/skeleton'

export function OfflineProfile() {
  const [doctor, setDoctor] = useState<CachedDoctor | null>(null)
  const [services, setServices] = useState<CachedService[]>([])
  const [vaccins, setVaccins] = useState<CachedVaccin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      offlineDb.doctors.toArray(),
      offlineDb.services.toArray(),
      offlineDb.vaccins.toArray(),
    ])
      .then(([docs, svcs, vacs]) => {
        setDoctor(docs[0] ?? null)
        setServices(svcs)
        setVaccins(vacs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Profile not found in offline cache.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full">
      {/* Doctor Info — mirrors the online profile layout */}
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50">
        <div className="flex flex-row w-full justify-between">
          <p className="font-light text-slate-900">
            Dr{' '}
            <span className="font-bold">
              {doctor.firstname} {doctor.lastname}
            </span>
          </p>
          <span className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
            <WifiOff className="h-3 w-3" />
            Offline — read only
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <p className="text-sm font-semibold">
            Email: <span className="font-normal">{doctor.email}</span>
          </p>
          <p className="text-sm font-semibold">
            Phone: <span className="font-normal">{doctor.phone}</span>
          </p>
          <p className="text-sm font-semibold">
            Specialty: <span className="font-normal">{doctor.spec}</span>
          </p>
          <p className="text-sm font-semibold col-span-2">
            Address: <span className="font-normal">{doctor.address}</span>
          </p>
        </div>
      </div>

      {/* Tracked Vaccines */}
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <p className="text-sm font-semibold">Tracked Vaccines</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaccins.length === 0 ? (
            <p className="text-sm text-slate-500 col-span-full">
              No tracked vaccines cached.
            </p>
          ) : (
            vaccins.map((v) => (
              <Card key={v._id} className="rounded-md pt-0 overflow-visible">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">{v.name}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Services */}
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <p className="text-sm font-semibold">Services</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.length === 0 ? (
            <p className="text-sm text-slate-500 col-span-full">
              No services cached.
            </p>
          ) : (
            services.map((s) => (
              <Card key={s._id} className="rounded-md pt-0 overflow-visible">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-slate-600 italic">{s.type}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {s.price.toFixed(2)} {s.currency}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
