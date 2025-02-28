"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useQuery } from "@tanstack/react-query"

interface CommonConditionsProps {
  appointments: {
    id: string;
    startDate: Date;
    findings: string | null;
  }[]
}

interface Condition {
  name: string
  count: number
}

async function classifyAndCountConditions(appointments: {
  id: string;
  startDate: Date;
  findings: string | null;
}[]): Promise<Condition[]> {
  try {
    const response = await fetch('/api/classify-conditions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        diagnoses: appointments.map(app => app.findings).filter(Boolean) 
      }),
    })
    
    if (!response.ok) throw new Error('Classification failed')
    
    const conditions = await response.json()
    return conditions
  } catch (error) {
    console.error('Error classifying conditions:', error)
    return []
  }
}

const chartConfig = {
  count: {
    label: "Patients",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function CommonConditionsChart({ appointments }: CommonConditionsProps) {
  const { data: conditions = [] } = useQuery({
    queryKey: ['common-conditions'],
    queryFn: () => classifyAndCountConditions(appointments),
    staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
  })

  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Common Conditions</CardTitle>
        <CardDescription>Most frequent diagnoses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px] w-full" config={chartConfig}>
          <BarChart
            data={conditions}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Bar 
              dataKey="count" 
              fill="hsl(142.1 76.2% 36.3%)" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 