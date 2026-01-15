"use client"

import { useState } from "react"
import { Printer, Maximize2 } from "lucide-react"
import Link from "next/link"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
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
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"

interface Patient {
  _id: string;
  firstname?: string;
  lastname?: string;
  sex?: string;
}

interface ChartDataItem {
  age?: number;
  length?: number;
  '3rd'?: number | null;
  '15th'?: number | null;
  '50th'?: number | null;
  '85th'?: number | null;
  '97th'?: number | null;
  [key: string]: number | null | undefined;
}

interface ChartShadProps {
  patient: Patient;
  type: string;
  title: string;
  ylabel: string;
  xlabel: string;
  name?: string;
  data: ChartDataItem[] | null;
  yUnit: string;
  xUnit: string;
  showTitle: boolean;
  mesure: string;
}

// Reusable chart component for both inline and dialog
function ChartContent({
  chartData,
  chartConfig,
  mesure,
  xlabel,
  ylabel,
  type,
  yUnit,
  xUnit,
  patientName,
  height = "h-[400px]",
}: {
  chartData: ChartDataItem[];
  chartConfig: ChartConfig;
  mesure: string;
  xlabel: string;
  ylabel: string;
  type: string;
  yUnit: string;
  xUnit: string;
  patientName: string;
  height?: string;
}) {
  return (
    <ChartContainer config={chartConfig} className={`${height} w-full max-w-full`}>
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
        <CartesianGrid 
          vertical={false} 
          strokeDasharray="3 3"
          className="stroke-border/40"
        />
        <XAxis
          dataKey={mesure}
          tickLine={true}
          axisLine={true}
          tickMargin={8}
          tickFormatter={(value) => value.toString()}
          label={{ 
            value: xlabel, 
            position: "insideBottom", 
            offset: 15, 
            fontSize: 12, 
            fontWeight: "500",
            className: "fill-muted-foreground"
          }} 
          height={60}
          className="text-muted-foreground"
        />
        <YAxis 
          label={{ 
            value: ylabel, 
            angle: -90, 
            position: 'insideLeft', 
            fontSize: 12, 
            fontWeight: "500",
            className: "fill-muted-foreground"
          }} 
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <ChartLegend 
          verticalAlign="top" 
          align="center" 
          height={36}
          wrapperStyle={{ paddingBottom: '16px' }}
        />
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
                        <span className="font-normal text-muted-foreground">
                          {yUnit}
                        </span>
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
          strokeWidth={1.5}
          strokeOpacity={0.7}
          dot={false}
        />
        <Line
          dataKey="15th"
          type="monotone"
          stroke="#f97316"
          strokeWidth={1.5}
          strokeOpacity={0.7}
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
          strokeWidth={1.5}
          strokeOpacity={0.7}
          dot={false}
        />
        <Line
          dataKey="97th"
          type="monotone"
          stroke="#a855f7"
          strokeWidth={1.5}
          strokeOpacity={0.7}
          dot={false}
        />
        {/* Patient data line - on top */}
        <Line
          dataKey={patientName}
          type="monotone"
          stroke="var(--primary)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "var(--primary)", strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 6, strokeWidth: 3, stroke: "#fff", fill: "var(--primary)" }}
          connectNulls={true}
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-out"
          name={patientName}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function ChartShad({ 
  patient, 
  type, 
  title, 
  ylabel, 
  xlabel, 
  name, 
  data, 
  yUnit, 
  xUnit, 
  showTitle, 
  mesure 
}: ChartShadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const chartData = useMemo(() => data ?? [], [data]);
  const patientName = name ?? 'patient';

  const chartConfig = {
    [type]: {
      label: title,
    },
    [mesure]: {
      label: mesure,
    },
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
    [patientName]: {
      label: patientName,
      color: "var(--primary)",
    },
  } satisfies ChartConfig

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h4 className="font-medium text-foreground mb-2">{title}</h4>
            <p className="text-sm text-muted-foreground">
              No data available for this chart yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 w-full overflow-hidden">
        <Card className="overflow-hidden w-full">
          {showTitle && (
            <CardHeader className="flex flex-row justify-between items-center gap-4 pb-2">
              <CardTitle className="text-base font-normal">
                {title} graph for{" "}
                <span className="font-semibold text-foreground">
                  {patient.firstname} {patient.lastname}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  title="Expand chart"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Expand
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                >
                  <Link href={`/user/patients/${patient._id}/charts/print-${type}`}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Link>
                </Button>
              </div>
            </CardHeader>
          )}
          
          <CardContent className="pt-4">
            <ChartContent
              chartData={chartData}
              chartConfig={chartConfig}
              mesure={mesure}
              xlabel={xlabel}
              ylabel={ylabel}
              type={type}
              yUnit={yUnit}
              xUnit={xUnit}
              patientName={patientName}
            />
          </CardContent>
          
          <CardFooter className="pt-0 pb-4">
            <div className="w-full text-center">
              <p className="text-xs text-muted-foreground">
                WHO Growth Standards • Patient data shown in blue
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Expanded Chart Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>{title}</span>
              <span className="text-sm font-normal text-muted-foreground">
                for {patient.firstname} {patient.lastname}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="h-[70vh] min-h-[500px]">
            <ChartContent
              chartData={chartData}
              chartConfig={chartConfig}
              mesure={mesure}
              xlabel={xlabel}
              ylabel={ylabel}
              type={type}
              yUnit={yUnit}
              xUnit={xUnit}
              patientName={patientName}
              height="h-full"
            />
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-muted-foreground">
              WHO Growth Standards • Patient data shown in blue
            </p>
            <Button 
              asChild 
              variant="outline" 
              size="sm"
            >
              <Link href={`/user/patients/${patient._id}/charts/print-${type}`}>
                <Printer className="h-4 w-4 mr-2" />
                Print Chart
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ChartShad;
