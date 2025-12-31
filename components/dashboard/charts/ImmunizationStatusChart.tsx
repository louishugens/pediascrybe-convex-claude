"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface VaccinationRecord {
  _id: string;
  patientId: string;
}

interface Patient {
  _id: string;
  vaccinationRecords?: VaccinationRecord[];
}

interface ImmunizationStatusProps {
  patients: Patient[]
}

export function ImmunizationStatusChart({ patients }: ImmunizationStatusProps) {
  const calculateImmunizationStatus = () => {
    const completed = patients.filter(patient => 
      patient.vaccinationRecords && patient.vaccinationRecords.length >= 4
    ).length
    const partial = patients.filter(patient => 
      patient.vaccinationRecords && 
      patient.vaccinationRecords.length > 0 && 
      patient.vaccinationRecords.length < 4
    ).length
    const pending = patients.filter(patient => 
      !patient.vaccinationRecords || patient.vaccinationRecords.length === 0
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
  )
}
