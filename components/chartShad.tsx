"use client"

import { TrendingUp, Printer } from "lucide-react"
import Link from "next/link"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { useMemo } from "react"




export function ChartShad({patient, type, title, ylabel, xlabel, name, data, yUnit, xUnit, showTitle, mesure}) {

  const chartData = useMemo(() => {
    return data
  }, [data]);


  const chartConfig = {
    [type]: {
      label: title,
    },
    [mesure]: {
      label: mesure,
    },
    "3rd": {
      label: "3rd",
      color: "hsl(var(--chart-1))",
    },
    "15th": {
      label: "15th",
      color: "hsl(var(--chart-2))",
    },
    "50th": {
      label: "30th",
      color: "hsl(var(--chart-3))",
    },
    "85th": {
      label: "85th",
      color: "hsl(var(--chart-4))",
    },
    "97th": {
      label: "97th",
      color: "hsl(var(--chart-5))",
    },
    [name]: {
      label: name ?? 'patient',
      color: "#0000ff",
    },
  } satisfies ChartConfig

  return (
    <div className="p-4">
      <Card className="pt-8">
        {showTitle &&
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-base font-normal">{title} graph for <span className="font-bold">{patient.firstname} {patient.lastname}</span></CardTitle>
          <Link href={`/user/patients/${patient.id}/charts/print-${type}`} className="px-4 py-2 rounded-full bg-slate-200 text-blue-500 text-sm w-fit flex flex-row items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Link>
        </CardHeader>
        }
        <CardContent>
          <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              {/* <XAxis
                dataKey={mesure}
                tickLine={false}
                axisLine={true}
                tickMargin={16}
                tick={{
                  fontSize: 12,
                  textAnchor: "end",
                  dy: 10
                }}
                tickFormatter={(value) => value.toString()}
                label={{ value: xlabel, position: "insideBottom", offset: 5}} 
              /> */}
              <XAxis
                dataKey={mesure}
                tickLine={true}
                axisLine={true}
                tickMargin={8}
                tickFormatter={(value) => value.toString()}
                label={{ value: xlabel, position: "insideBottom", offset: 15, fontSize: 12, fontWeight: "bold"}} 
                height={60}
              />
              <YAxis 
                label={{ value: ylabel, angle: -90, position: 'insideLeft', fontSize: 12, fontWeight: "bold"}} 
                tick={{fontSize: 12}} 
              />
              <ChartLegend content={<ChartLegendContent />} verticalAlign="top" align="center" height={12} />
              <ChartTooltip 
                cursor={true}
                content={
                  <ChartTooltipContent
                    indicator='dashed'
                    labelKey={type}
                    nameKey={mesure}
                    formatter={(value, name, props) => (
                      <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                        style={
                          {
                            "--color-bg": `var(--color-${name})`,
                          } as React.CSSProperties
                        }
                      />
                      <div className="flex min-w-[130px] items-center text-xs text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label ||
                          name}
                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                          {value}
                          <span className="font-normal text-muted-foreground">
                            {yUnit}
                          </span>
                        </div>
                      </div>
                      </>
                    )}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const xValue = payload[0].payload[mesure];
                        // Truncate xValue to first decimal place
                        const truncatedXValue = typeof xValue === 'number' 
                          ? Math.floor(xValue * 10) / 10
                          : xValue;
                        
                        return (
                          <div className="mb-2 text-sm font-medium">
                            {label}: <span className="font-bold">{truncatedXValue} {xUnit}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                } 
                defaultIndex={1}
               />
              <Line
                dataKey={name}
                type="monotone"
                stroke="#0900ff"
                strokeWidth={2}
                dot={{ r: 2, fill: "#0000ff", strokeWidth: 1 }}
                activeDot={{ r: 4, strokeWidth: 1, stroke: "#fff" }}
                connectNulls={true}
                isAnimationActive={false}
                name={name}
                key={name}
              />
              <Line
                dataKey="3rd"
                type="monotone"
                stroke="var(--color-3rd)"
                strokeWidth={1}
                dot={false}
              />
              <Line
                dataKey="15th"
                type="monotone"
                stroke="var(--color-15th)"
                strokeWidth={1}
                dot={false}
              />
              <Line
                dataKey="50th"
                type="monotone"
                stroke="var(--color-50th)"
                strokeWidth={1}
                dot={false}
              />
              <Line
                dataKey="85th"
                type="monotone"
                stroke="var(--color-85th)"
                strokeWidth={1}
                dot={false}
              />
              <Line
                dataKey="97th"
                type="monotone"
                stroke="var(--color-97th)"
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          {/* <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 font-medium leading-none">
                Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                Showing total visitors for the last 6 months
              </div>
            </div>
          </div> */}
        </CardFooter>
      </Card>
    </div>
  )
}

export default ChartShad;