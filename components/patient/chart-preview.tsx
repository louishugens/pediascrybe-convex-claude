"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart"
import { useMemo } from "react"

interface ChartPreviewProps {
  type: string;
  title: string;
  ylabel: string;
  xlabel: string;
  name: string;
  data: Record<string, unknown>[];
  yUnit: string;
  xUnit: string;
  mesure: string;
}

export default function ChartPreview({ 
  type, 
  title, 
  ylabel, 
  xlabel, 
  name, 
  data, 
  yUnit, 
  xUnit, 
  mesure 
}: ChartPreviewProps) {
  const chartData = useMemo(() => data, [data]);

  const chartConfig = {
    [type]: {
      label: title,
    },
    [mesure]: {
      label: mesure,
    },
    "3rd": {
      label: "3rd percentile",
      color: "#ef4444", // red
    },
    "15th": {
      label: "15th percentile",
      color: "#f97316", // orange
    },
    "50th": {
      label: "50th percentile",
      color: "#22c55e", // green
    },
    "85th": {
      label: "85th percentile",
      color: "#ec4899", // pink
    },
    "97th": {
      label: "97th percentile",
      color: "#a855f7", // purple/fuchsia
    },
    [name]: {
      label: name ?? 'patient',
      color: "var(--primary)",
    },
  } satisfies ChartConfig

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No chart data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
          top: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid vertical={false} />
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
        <ChartLegend verticalAlign="top" align="center" height={12} />
        <ChartTooltip 
          cursor={true}
          content={
            <ChartTooltipContent
              indicator='dashed'
              labelKey={type}
              nameKey={mesure}
              formatter={(value, lineName) => {
                const lineColor = chartConfig[lineName as keyof typeof chartConfig]?.color;
                return (
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: lineColor }}
                    />
                    <div className="flex flex-1 min-w-[130px] items-center text-xs text-muted-foreground">
                      {chartConfig[lineName as keyof typeof chartConfig]?.label || lineName}
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {value}
                        <span className="font-normal text-muted-foreground">{yUnit}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  const xValue = payload[0].payload[mesure];
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
        {/* Reference percentile lines */}
        <Line
          dataKey="3rd"
          type="monotone"
          stroke="#ef4444"
          strokeWidth={1}
          dot={false}
        />
        <Line
          dataKey="15th"
          type="monotone"
          stroke="#f97316"
          strokeWidth={1}
          dot={false}
        />
        <Line
          dataKey="50th"
          type="monotone"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="85th"
          type="monotone"
          stroke="#ec4899"
          strokeWidth={1}
          dot={false}
        />
        <Line
          dataKey="97th"
          type="monotone"
          stroke="#a855f7"
          strokeWidth={1}
          dot={false}
        />
        {/* Patient data line - on top */}
        <Line
          dataKey={name}
          type="monotone"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--primary)", strokeWidth: 1 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          connectNulls={true}
          isAnimationActive={false}
          name={name}
        />
      </LineChart>
    </ChartContainer>
  )
}
