'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePaginatedQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import TransactionsPageSkeleton from '@/components/skeletons/transactions-page-skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CalendarIcon, ChevronDown, Loader2 } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/currency'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Transaction {
  id: string
  date: number // ms timestamp
  patientName: string
  serviceName: string
  price: number
  currency: string
}

interface DayGroup {
  key: string // yyyy-MM-dd
  date: Date
  transactions: Transaction[]
  totals: { currency: string; amount: number }[]
}

interface MonthGroup {
  key: string // yyyy-MM
  date: Date
  days: DayGroup[]
  totals: { currency: string; amount: number }[]
}

const PAGE_SIZE = 50

function sumByCurrency(transactions: Transaction[]) {
  const totals = new Map<string, number>()
  for (const t of transactions) {
    totals.set(t.currency, (totals.get(t.currency) || 0) + t.price)
  }
  return [...totals.entries()].map(([currency, amount]) => ({ currency, amount }))
}

function formatTotals(totals: { currency: string; amount: number }[]) {
  return totals.map((t) => formatCurrency(t.amount, t.currency)).join(' + ')
}

function dayLabel(date: Date) {
  if (isToday(date)) return `Today — ${format(date, 'EEEE, MMMM d')}`
  if (isYesterday(date)) return `Yesterday — ${format(date, 'EEEE, MMMM d')}`
  return format(date, 'EEEE, MMMM d, yyyy')
}

export default function TransactionsPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.appointments.getTransactionsPaginated,
    {},
    { initialNumItems: PAGE_SIZE }
  )

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const [openDays, setOpenDays] = useState<Set<string>>(() => new Set([todayKey]))
  const [jumpTarget, setJumpTarget] = useState<Date | null>(null)
  const [jumpMessage, setJumpMessage] = useState<string | null>(null)
  const pendingScrollKey = useRef<string | null>(null)

  // Results arrive newest-first; group them by day, then by month
  const months = useMemo<MonthGroup[]>(() => {
    const dayMap = new Map<string, DayGroup>()
    for (const t of results) {
      const date = new Date(t.date)
      const key = format(date, 'yyyy-MM-dd')
      let group = dayMap.get(key)
      if (!group) {
        group = { key, date, transactions: [], totals: [] }
        dayMap.set(key, group)
      }
      group.transactions.push(t)
    }

    const monthMap = new Map<string, MonthGroup>()
    for (const day of dayMap.values()) {
      day.totals = sumByCurrency(day.transactions)
      const key = format(day.date, 'yyyy-MM')
      let month = monthMap.get(key)
      if (!month) {
        month = { key, date: day.date, days: [], totals: [] }
        monthMap.set(key, month)
      }
      month.days.push(day)
    }
    for (const month of monthMap.values()) {
      month.totals = sumByCurrency(month.days.flatMap((d) => d.transactions))
    }
    return [...monthMap.values()]
  }, [results])

  const toggleDay = (key: string, open: boolean) => {
    setOpenDays((prev) => {
      const next = new Set(prev)
      if (open) next.add(key)
      else next.delete(key)
      return next
    })
  }

  // Jump-to-date: load pages until the target date is covered, then open + scroll
  useEffect(() => {
    if (!jumpTarget) return
    if (status === 'LoadingFirstPage' || status === 'LoadingMore') return

    const targetKey = format(jumpTarget, 'yyyy-MM-dd')
    const startOfTarget = new Date(
      jumpTarget.getFullYear(),
      jumpTarget.getMonth(),
      jumpTarget.getDate()
    ).getTime()
    const oldestLoaded = results.length > 0 ? results[results.length - 1].date : null

    const hasDay = results.some((t) => format(new Date(t.date), 'yyyy-MM-dd') === targetKey)
    if (hasDay) {
      setJumpTarget(null)
      setOpenDays((prev) => new Set(prev).add(targetKey))
      pendingScrollKey.current = targetKey
      return
    }

    if (status === 'CanLoadMore' && (oldestLoaded === null || oldestLoaded > startOfTarget)) {
      loadMore(PAGE_SIZE * 2)
      return
    }

    // Loaded past the target date (or everything) without finding it
    setJumpTarget(null)
    setJumpMessage(`No transactions on ${format(jumpTarget, 'MMMM d, yyyy')}`)
  }, [jumpTarget, status, results, loadMore])

  // Scroll to a day once it is rendered
  useEffect(() => {
    if (!pendingScrollKey.current) return
    const el = document.getElementById(`day-${pendingScrollKey.current}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      pendingScrollKey.current = null
    }
  })

  useEffect(() => {
    if (!jumpMessage) return
    const timer = setTimeout(() => setJumpMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [jumpMessage])

  const isJumping = jumpTarget !== null

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Transactions</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Jump to date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={jumpTarget ?? undefined}
              onSelect={(date) => {
                if (date) {
                  setJumpMessage(null)
                  setJumpTarget(date)
                }
              }}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {jumpMessage && (
        <div className="rounded-md border bg-muted px-4 py-3 text-sm text-muted-foreground">
          {jumpMessage}
        </div>
      )}
      {isJumping && (
        <div className="flex items-center gap-2 rounded-md border bg-muted px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading transactions up to {format(jumpTarget!, 'MMMM d, yyyy')}…
        </div>
      )}

      {status === 'LoadingFirstPage' ? (
        <TransactionsPageSkeleton />
      ) : months.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No transactions yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {months.map((month) => (
            <section key={month.key} className="space-y-3">
              <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/75">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {format(month.date, 'MMMM yyyy')}
                </h2>
                <span className="text-sm font-semibold">{formatTotals(month.totals)}</span>
              </div>

              {month.days.map((day) => {
                const isOpen = openDays.has(day.key)
                return (
                  <Collapsible
                    key={day.key}
                    open={isOpen}
                    onOpenChange={(open) => toggleDay(day.key, open)}
                  >
                    <Card id={`day-${day.key}`} className="scroll-mt-16 overflow-hidden py-0 gap-0">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                                isOpen && 'rotate-180'
                              )}
                            />
                            <span className="font-medium truncate">{dayLabel(day.date)}</span>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-sm text-muted-foreground">
                              {day.transactions.length}{' '}
                              {day.transactions.length === 1 ? 'transaction' : 'transactions'}
                            </span>
                            <span className="font-semibold">{formatTotals(day.totals)}</span>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t px-4 pb-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-20">Time</TableHead>
                                <TableHead>Patient Name</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {day.transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell className="font-medium">
                                    {format(new Date(transaction.date), 'HH:mm')}
                                  </TableCell>
                                  <TableCell>{transaction.patientName}</TableCell>
                                  <TableCell>{transaction.serviceName}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(transaction.price, transaction.currency)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )
              })}
            </section>
          ))}

          {status !== 'Exhausted' && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                disabled={status === 'LoadingMore' || isJumping}
                onClick={() => loadMore(PAGE_SIZE)}
              >
                {status === 'LoadingMore' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  'Load earlier days'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
