"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Patient, VaccinationRecord } from "@prisma/client"

interface ImmunizationStatusProps {
  patients: (Patient & {
    VaccinationRecords?: VaccinationRecord[]
  })[]
}

export function ImmunizationStatusChart({ patients }: ImmunizationStatusProps) {
  const calculateImmunizationStatus = () => {
    const completed = patients.filter(patient => 
      patient.VaccinationRecords && patient.VaccinationRecords.length >= 4
    ).length
    const partial = patients.filter(patient => 
      patient.VaccinationRecords && 
      patient.VaccinationRecords.length > 0 && 
      patient.VaccinationRecords.length < 4
    ).length
    const pending = patients.filter(patient => 
      !patient.VaccinationRecords || patient.VaccinationRecords.length === 0
    ).length

    return [
      { status: "Completed", count: completed, fill: "hsl(142.1 76.2% 36.3%)" },
      { status: "Partial", count: partial, fill: "hsl(48 96% 53%)" },
      { status: "Pending", count: pending, fill: "hsl(0 84% 60%)" }
    ]
  }

  const chartData = calculateImmunizationStatus()
  const totalPatients = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  const chartConfig = {
    count: {
      label: "Patients",
    },
    completed: {
      label: "Completed",
      color: "hsl(142.1 76.2% 36.3%)",
    },
    partial: {
      label: "Partial",
      color: "hsl(48 96% 53%)",
    },
    pending: {
      label: "Pending",
      color: "hsl(0 84% 60%)",
    },
  } satisfies ChartConfig

  return (
    <Card className="glass card-hover">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Immunization Status</CardTitle>
        <CardDescription>Immunization completion status</CardDescription>
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
              nameKey="status"
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
                          Total
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground italic">Immunization completion status among all the patients</p>
      </CardFooter>
    </Card>
  )
} 