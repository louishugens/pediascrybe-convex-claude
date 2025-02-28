"use client"

import * as React from "react"
import { Label, Pie, PieChart, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Patient } from "@prisma/client"

interface GenderDistributionProps {
  patients: Patient[]
}

export function GenderDistributionChart({ patients }: GenderDistributionProps) {
  const calculateGenderDistribution = () => {
    const male = patients.filter(patient => patient.sex === 'male').length
    const female = patients.filter(patient => patient.sex === 'female').length

    return [
      { gender: "Boys", count: male, fill: "hsl(142.1 76.2% 36.3%)" },
      { gender: "Girls", count: female, fill: "hsl(142.1 76.2% 26.3%)" }
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
      color: "hsl(142.1 76.2% 36.3%)",
    },
    female: {
      label: "Girls",
      color: "hsl(142.1 76.2% 56.3%)",
    },
  } satisfies ChartConfig
 
  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Sex Distribution</CardTitle>
        <CardDescription>Distribution of patients by sex</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
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
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Sex distribution among all the patients</p>
      </CardFooter>
    </Card>
  )
} 