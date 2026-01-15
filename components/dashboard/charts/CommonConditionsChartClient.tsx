"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

interface Condition {
  name: string
  count: number
}

interface CommonConditionsChartClientProps {
  conditions: Condition[]
}

const chartConfig = {
  count: {
    label: "Patients",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function CommonConditionsChartClient({ conditions }: CommonConditionsChartClientProps) {
  return (
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
          fill="var(--primary)" 
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}

