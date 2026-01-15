"use client"

import * as React from "react"
import { Label, Pie, PieChart, Legend } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface Patient {
  sex?: "male" | "female" | null;
}

interface GenderDistributionProps {
  patients: Patient[]
}

export function GenderDistributionChart({ patients }: GenderDistributionProps) {
  const calculateGenderDistribution = () => {
    const male = patients.filter(patient => patient.sex === 'male').length
    const female = patients.filter(patient => patient.sex === 'female').length

    return [
      { gender: "Boys", count: male, fill: "var(--primary)" },
      { gender: "Girls", count: female, fill: "color-mix(in oklch, var(--primary) 60%, transparent)" }
    ]
  }

  const chartData = calculateGenderDistribution()
  const totalPatients = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  const chartConfig = {
    count: {
      label: "Patients",
    },
    male: {
      label: "Boys",
      color: "var(--primary)",
    },
    female: {
      label: "Girls",
      color: "color-mix(in oklch, var(--primary) 60%, transparent)",
    },
  } satisfies ChartConfig
 
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="gender"
          innerRadius={60}
          strokeWidth={5}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {totalPatients}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Total Patients
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
        <Legend />
      </PieChart>
    </ChartContainer>
  )
}
