"use client"

import { useState, useEffect, useMemo, useCallback, memo } from 'react'

// Simple cache for reference data to avoid repeated API calls
const referenceDataCache = new Map<string, any>()
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Loader2 } from "lucide-react"

interface GrowthChartData {
  type: 'growthChart'
  chartType: string
  patientSex: string | null
  patientLabel: string
  patientBirthdate: Date
  growthData: Array<{
    age?: number
    length?: number
    value: number
  }>
  yLabel: string
  xLabel: string
  unit: string
  title: string
  dataPoints: number
}

interface ChatGrowthChartProps {
  data: GrowthChartData
}

function ChatGrowthChartInner({ data }: ChatGrowthChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Move all hook calls to the top, before any conditional returns
  const measureType = data.chartType.startsWith('wfl') ? 'length' : 'age'
  const xUnit = data.chartType === 'hfa5To19' || data.chartType === 'bfa5To19' ? 'months' : 
               data.chartType.startsWith('wfl') ? 'cm' : 'days'

  // Create a stable reference for chart data to prevent unnecessary re-renders
  const memoizedChartData = useMemo(() => {
    return chartData
  }, [chartData]);

  const chartConfig = useMemo(() => ({
    "3rd": {
      label: "3rd percentile",
      color: "#ef4444",
    },
    "15th": {
      label: "15th percentile",
      color: "#f97316",
    },
    "50th": {
      label: "50th percentile",
      color: "#22c55e",
    },
    "85th": {
      label: "85th percentile",
      color: "#ec4899",
    },
    "97th": {
      label: "97th percentile",
      color: "#a855f7",
    },
    [data.patientLabel]: {
      label: data.patientLabel,
      color: "var(--primary)",
    },
  }) satisfies ChartConfig, [data.patientLabel])

  // Memoize tooltip formatter to prevent recreation on every render
  const tooltipFormatter = useCallback((value: any, name: string) => {
    const lineColor = chartConfig[name as keyof typeof chartConfig]?.color;
    return (
      <div className="flex items-center gap-2 w-full min-w-[180px] text-xs text-muted-foreground py-1">
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: lineColor }}
        />
        <span className="flex-1">{chartConfig[name as keyof typeof chartConfig]?.label || name}</span>
        <div className="ml-4 flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
          {data.unit === 'kg/m²' && typeof value === 'number' ? 
            (Math.round(value * 100) / 100).toFixed(2) : value}
          <span className="font-normal text-muted-foreground ml-1">{data.unit}</span>
        </div>
      </div>
    );
  }, [chartConfig, data.unit])

  // Memoize label formatter to prevent recreation on every render
  const tooltipLabelFormatter = useCallback((label: any, payload: any[]) => {
    if (payload && payload.length > 0) {
      const xValue = payload[0].payload[measureType];
      const truncatedXValue = typeof xValue === 'number' 
        ? Math.floor(xValue * 10) / 10
        : xValue;
      
      let ageFormatted = '';
      let displayValue = truncatedXValue;
      let displayUnit = xUnit;
      
      if (measureType === 'age' && typeof xValue === 'number') {
        if (data.chartType === 'hfa5To19' || data.chartType === 'bfa5To19') {
          const ageInMonths = xValue + 60;
          displayValue = ageInMonths;
          displayUnit = 'months';
          const years = Math.floor(ageInMonths / 12);
          const months = ageInMonths % 12;
          ageFormatted = years > 0 ? ` (${years}y ${months}m)` : ` (${months}m)`;
        } else if (xUnit === 'days') {
          const years = Math.floor(xValue / 365);
          const months = Math.floor((xValue % 365) / 30);
          if (years > 0) {
            ageFormatted = ` (${years}y ${months}m)`;
          } else if (months > 0) {
            ageFormatted = ` (${months}m)`;
          }
        }
      }
      
      const labelText = measureType === 'length' ? 'Length' : 'Age';
      
      return (
        <div className="mb-3 text-sm font-medium">
          {labelText}: <span className="font-bold">{displayValue} {displayUnit}</span>
          <span className="text-muted-foreground">{ageFormatted}</span>
        </div>
      );
    }
    return null;
  }, [measureType, xUnit, data.chartType])

  useEffect(() => {
    let isCancelled = false;
    
    async function fetchReferenceData() {
      try {
        setLoading(true)
        setError(null)

        // Determine chart ID based on sex and chart type
        const chartIds = {
          wfa: data.patientSex === 'female' ? 'gwfa' : 'bwfa',
          hfa: data.patientSex === 'female' ? 'ghfa' : 'bhfa', 
          hfa5To19: data.patientSex === 'female' ? 'ghfa_5_19' : 'bhfa_5_19',
          bfa: data.patientSex === 'female' ? 'gbfa' : 'bbfa',
          bfa5To19: data.patientSex === 'female' ? 'gbfa_5_19' : 'bbfa_5_19',
          hcfa: data.patientSex === 'female' ? 'ghcfa' : 'bhcfa',
          wfl: data.patientSex === 'female' ? 'gwfh' : 'bwfh',
          wfl0To2: data.patientSex === 'female' ? 'gwfh_0_2' : 'bwfh_0_2'
        }

        const chartId = chartIds[data.chartType as keyof typeof chartIds]
        if (!chartId) {
          throw new Error(`Unknown chart type: ${data.chartType}`)
        }

        // Check cache first to avoid repeated API calls
        let referenceData = referenceDataCache.get(chartId)
        
        if (!referenceData) {
          // Fetch reference data from API endpoint
          const response = await fetch(`/api/charts/reference?chartId=${chartId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch reference data')
          }

          referenceData = await response.json()
          
          // Cache the data for future use
          referenceDataCache.set(chartId, referenceData)
        }
        
        // Check if component was unmounted during fetch
        if (isCancelled) return;
        
        // Optimized chart data formatting
        const formatChartData = () => {
          const format: any[] = []
          const measureType = data.chartType.startsWith('wfl') ? 'length' : 'age'
          
          const maxLength = Math.max(
            (referenceData.p03 as number[])?.length || 0,
            (referenceData.p15 as number[])?.length || 0,
            (referenceData.p50 as number[])?.length || 0,
            (referenceData.p85 as number[])?.length || 0,
            (referenceData.p97 as number[])?.length || 0
          )

          // Limit processing to improve performance - most charts don't need more than 3000 points
          const processLength = Math.min(maxLength, 3000)
          
          // Pre-create a map for faster patient data lookup
          const patientDataMap = new Map();
          data.growthData.forEach(item => {
            if (measureType === 'age') {
              if (data.chartType === 'hfa5To19' || data.chartType === 'bfa5To19') {
                const chartIndex = (item.age || 0) - 60;
                if (chartIndex >= 0) patientDataMap.set(chartIndex, item.value);
              } else {
                patientDataMap.set(item.age, item.value);
              }
            } else if (measureType === 'length') {
              patientDataMap.set(item.length, item.value);
            }
          });

          // Process chart data in chunks to prevent blocking
          for (let index = 0; index < processLength; index++) {
            format.push({ 
              [measureType]: index,
              '3rd': referenceData.p03?.[index] ?? null, 
              '15th': referenceData.p15?.[index] ?? null, 
              '50th': referenceData.p50?.[index] ?? null, 
              '85th': referenceData.p85?.[index] ?? null, 
              '97th': referenceData.p97?.[index] ?? null,
              [data.patientLabel]: patientDataMap.get(index) ?? null
            })
          }

          return format
        }

        const formattedData = formatChartData()
        
        // Check again if component was unmounted during processing
        if (!isCancelled) {
          setChartData(formattedData)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchReferenceData()
    
    // Cleanup function to prevent memory leaks
    return () => {
      isCancelled = true;
    }
  // Use specific primitive values as dependencies instead of the entire data object
  // to prevent re-running when parent creates new object references
  }, [data.chartType, data.patientSex, data.patientLabel, data.growthData.length])

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading growth chart...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p>Error loading chart: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }



  return (
    <Card className="w-full mx-auto mb-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">
          {data.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          {data.dataPoints} data points available
        </p>
      </CardHeader>
      <CardContent>
        {/* Custom Legend outside chart */}
        <div className="flex flex-wrap justify-center gap-4 mb-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary"></div>
            <span className="font-bold">{data.patientLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span>3rd percentile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></div>
            <span>15th percentile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
            <span>50th percentile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ec4899' }}></div>
            <span>85th percentile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#a855f7' }}></div>
            <span>97th percentile</span>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-100 w-full">
          <LineChart
            accessibilityLayer
            data={memoizedChartData}
            margin={{
              left: 12,
              right: 12,
              top: 20,
              bottom: 20,
            }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={measureType}
                tickLine={true}
                axisLine={true}
                tickMargin={8}
                tickFormatter={(value) => {
                  if (data.chartType === 'hfa5To19' || data.chartType === 'bfa5To19') {
                    // For 5-19 charts, convert index to months starting at 60 months (5 years)
                    return (value + 60).toString();
                  }
                  return value.toString();
                }}
                label={{ value: `${data.xLabel} (${xUnit})`, position: "insideBottom", offset: -5, fontSize: 12, fontWeight: "bold"}}
                height={50}
              />
              <YAxis 
                label={{ value: `${data.yLabel} (${data.unit})`, angle: -90, position: 'insideLeft', fontSize: 12, fontWeight: "bold"}} 
                tick={{fontSize: 12}} 
              />

              <ChartTooltip 
                cursor={true}
                content={
                  <ChartTooltipContent
                    indicator='dashed'
                    labelKey={data.chartType}
                    nameKey={measureType}
                    formatter={tooltipFormatter}
                    labelFormatter={tooltipLabelFormatter}
                  />
                } 
                defaultIndex={1}
               />
              
              {/* Patient data line */}
              <Line
                dataKey={data.patientLabel}
                type="monotone"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--primary)", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 3, stroke: "#fff", fill: "var(--primary)" }}
                connectNulls={true}
                isAnimationActive={false}
                name={data.patientLabel}
              />
              
              {/* Reference percentile lines */}
              <Line
                dataKey="3rd"
                type="monotone"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="15th"
                type="monotone"
                stroke="#f97316"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="50th"
                type="monotone"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="85th"
                type="monotone"
                stroke="#ec4899"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="97th"
                type="monotone"
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
      </CardContent>
    </Card>
  )
}

// Wrap with memo and custom comparison to prevent unnecessary re-renders
const ChatGrowthChart = memo(ChatGrowthChartInner, (prevProps, nextProps) => {
  // Only re-render if these specific values change
  return (
    prevProps.data.chartType === nextProps.data.chartType &&
    prevProps.data.patientSex === nextProps.data.patientSex &&
    prevProps.data.patientLabel === nextProps.data.patientLabel &&
    prevProps.data.growthData.length === nextProps.data.growthData.length &&
    prevProps.data.title === nextProps.data.title
  )
})

export default ChatGrowthChart