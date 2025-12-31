"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface AgeDistributionProps {
  patients: Array<{ birthdate: number }>
}

export function AgeDistributionChart({ patients }: AgeDistributionProps) {
  const calculateAgeDistribution = () => {
    const ageGroups = {
      "0-2": 0,   // Infants and toddlers
      "3-5": 0,   // Preschool
      "6-8": 0,   // Early elementary
      "9-11": 0,  // Late elementary
      "12-14": 0, // Early teens
      "15-17": 0, // Late teens
      "18+": 0    // Young adults
    }

    patients.forEach(patient => {
      const age = new Date().getFullYear() - new Date(patient.birthdate).getFullYear()
      if (age <= 2) ageGroups["0-2"]++
      else if (age <= 5) ageGroups["3-5"]++
      else if (age <= 8) ageGroups["6-8"]++
      else if (age <= 11) ageGroups["9-11"]++
      else if (age <= 14) ageGroups["12-14"]++
      else if (age <= 17) ageGroups["15-17"]++
      else ageGroups["18+"]++
    })

    return Object.entries(ageGroups).map(([range, count]) => ({
      range,
      count
    }))
  }

  const chartData = calculateAgeDistribution()

  const chartConfig = {
    count: {
      label: "Patients",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  return (
    // <Card className="glass card-hover">
    //   <CardHeader>
    //     <CardTitle className="text-sm font-bold">Age Distribution</CardTitle>
    //     <CardDescription>Distribution of patients by age groups</CardDescription>
    //   </CardHeader>
    //   <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="range"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" fill="hsl(142.1 76.2% 26.3%)" radius={8} /> 
          </BarChart> 
         </ChartContainer>
      // </CardContent>
      // <CardFooter>
      //   <p className="text-xs text-muted-foreground italic">Age distribution among all the patients</p>
      // </CardFooter>
    // </Card> 
  )
} 