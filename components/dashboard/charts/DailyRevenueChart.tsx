'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/currency'
import { TrendingUp } from 'lucide-react'

interface DailyRevenueChartProps {
  data: Array<{ date: string; revenue: number; currency: string }>
}

export function DailyRevenueChart({ data }: DailyRevenueChartProps) {
  const [yearToDate, setYearToDate] = useState(true)

  // Ensure data is a valid array
  const safeData = useMemo(() => data ?? [], [data])

  // Filter data based on yearToDate
  const filteredData = useMemo(() => {
    if (!safeData.length) return []
    return yearToDate
      ? safeData.filter(item => {
          const itemDate = new Date(item.date)
          const currentYear = new Date().getFullYear()
          return itemDate.getFullYear() === currentYear
        })
      : safeData
  }, [safeData, yearToDate])

  // Get primary currency (most common in filtered data)
  const primaryCurrency = useMemo(() => {
    const currencyCounts = new Map<string, number>()
    filteredData.forEach(item => {
      currencyCounts.set(item.currency, (currencyCounts.get(item.currency) || 0) + 1)
    })
    let maxCount = 0
    let primary = 'USD'
    currencyCounts.forEach((count, currency) => {
      if (count > maxCount) {
        maxCount = count
        primary = currency
      }
    })
    return primary
  }, [filteredData])

  // Format date for display
  const formattedData = filteredData.map(item => ({
    ...item,
    dateFormatted: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))

  // Format currency for tooltip and Y-axis
  const formatCurrencyValue = (value: number) => formatCurrency(value, primaryCurrency)

  // Check if we have any data to display
  const hasData = formattedData.length > 0

  return (
    <Card className="glass card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">Daily Revenue</CardTitle>
            <CardDescription>Revenue trends over time</CardDescription>
          </div>
          {safeData.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant={yearToDate ? "default" : "outline"}
                size="sm"
                onClick={() => setYearToDate(true)}
              >
                YTD
              </Button>
              <Button
                variant={!yearToDate ? "default" : "outline"}
                size="sm"
                onClick={() => setYearToDate(false)}
              >
                All Time
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateFormatted" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={formatCurrencyValue}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrencyValue(value)}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm font-medium">No revenue data available</p>
            <p className="text-xs mt-1">
              {yearToDate 
                ? 'No appointments with costs recorded this year' 
                : 'Start recording appointment costs to see revenue trends'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">
          {yearToDate ? 'Year-to-date revenue by day' : 'All-time revenue by day'}
        </p>
      </CardFooter>
    </Card>
  )
}

