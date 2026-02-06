"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Spinner } from "@/components/ui/spinner"
import { format, differenceInDays } from "date-fns"
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useMemo } from "react"
import ChartPreview from "@/components/patient/chart-preview"
import { Button } from "@/components/ui/button"
import { AIExplainerCard } from "@/components/portal/ai-explainer-card"

interface ChartConfig {
  type: string
  title: string
  ylabel: string
  xlabel: string
  yUnit: string
  xUnit: string
  mesure: string
  refType: string
}

const chartConfigs: ChartConfig[] = [
  { type: "wfa", title: "Weight for Age", ylabel: "Weight (kg)", xlabel: "Age (days)", yUnit: "kg", xUnit: "days", mesure: "age", refType: "wfa" },
  { type: "hfa", title: "Height for Age", ylabel: "Height (cm)", xlabel: "Age (days)", yUnit: "cm", xUnit: "days", mesure: "age", refType: "hfa" },
  { type: "wfl", title: "Weight for Length", ylabel: "Weight (kg)", xlabel: "Length (cm)", yUnit: "kg", xUnit: "cm", mesure: "length", refType: "wfl0To2" },
  { type: "bfa", title: "BMI for Age", ylabel: "BMI (kg/m\u00b2)", xlabel: "Age (days)", yUnit: "kg/m\u00b2", xUnit: "days", mesure: "age", refType: "bfa" },
  { type: "hcfa", title: "Head Circumference", ylabel: "Head Circ. (cm)", xlabel: "Age (days)", yUnit: "cm", xUnit: "days", mesure: "age", refType: "hcfa" },
]

export default function GrowthPage() {
  const params = useParams()
  const patientId = params.patientId as Id<"patients">
  const [currentIndex, setCurrentIndex] = useState(0)

  const growthData = useQuery(api.portal.getPatientGrowthData, { patientId })
  const patient = useQuery(api.portal.getPatientDetails, { patientId })

  const currentConfig = chartConfigs[currentIndex]

  // Fetch reference data for the current chart type
  const referenceData = useQuery(api.charts.getReferenceData, {
    chartType: currentConfig.refType,
    sex: patient?.sex as "male" | "female" | undefined,
  })

  const patientName = patient?.firstname ?? "patient"
  const birthdate = patient?.birthdate ?? Date.now()

  // Compute chart data from growth measurements + reference data
  const chartData = useMemo(() => {
    if (!referenceData || !growthData) return []

    const refData = referenceData as { p03?: number[]; p15?: number[]; p50?: number[]; p85?: number[]; p97?: number[] }

    // Build patient data points based on chart type
    const patientPoints: { key: number; value: number }[] = []

    for (const apt of growthData) {
      const ageInDays = differenceInDays(apt.startDate, birthdate)

      switch (currentConfig.type) {
        case "wfa":
          if (apt.weight) patientPoints.push({ key: ageInDays, value: apt.weight })
          break
        case "hfa":
          if (apt.height && ageInDays / 30.4375 <= 60) patientPoints.push({ key: ageInDays, value: apt.height })
          break
        case "wfl":
          if (apt.weight && apt.height && ageInDays < 365 * 2) patientPoints.push({ key: apt.height, value: apt.weight })
          break
        case "bfa":
          if (apt.weight && apt.height && ageInDays / 30.4375 <= 60) {
            const bmi = apt.weight / Math.pow(apt.height / 100, 2)
            patientPoints.push({ key: ageInDays, value: parseFloat(bmi.toPrecision(5)) })
          }
          break
        case "hcfa":
          if (apt.head) patientPoints.push({ key: ageInDays, value: apt.head })
          break
      }
    }

    // Format reference data array with patient data overlaid
    const maxLength = Math.max(
      refData.p03?.length || 0,
      refData.p15?.length || 0,
      refData.p50?.length || 0,
      refData.p85?.length || 0,
      refData.p97?.length || 0
    )

    const isLengthBased = currentConfig.mesure === "length"
    const formatted: Record<string, number | null | undefined>[] = []

    for (let i = 0; i < maxLength; i++) {
      const xValue = isLengthBased ? 45 + i * 0.5 : i
      const match = isLengthBased
        ? patientPoints.find((p) => Math.abs(p.key - xValue) < 0.25)
        : patientPoints.find((p) => p.key === i)

      formatted.push({
        [currentConfig.mesure]: xValue,
        "3rd": refData.p03?.[i] ?? null,
        "15th": refData.p15?.[i] ?? null,
        "50th": refData.p50?.[i] ?? null,
        "85th": refData.p85?.[i] ?? null,
        "97th": refData.p97?.[i] ?? null,
        [patientName]: match?.value ?? null,
      })
    }

    return formatted
  }, [referenceData, growthData, birthdate, currentConfig, patientName])

  if (growthData === undefined || patient === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (growthData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Growth Charts</h2>
          <p className="text-sm text-muted-foreground">Track your child&apos;s growth over time</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No growth data recorded yet.</p>
          <p className="text-xs mt-1">Growth data is recorded during appointments.</p>
        </div>
      </div>
    )
  }

  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + chartConfigs.length) % chartConfigs.length)
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % chartConfigs.length)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Growth Charts</h2>
        <p className="text-sm text-muted-foreground">Track your child&apos;s growth over time</p>
      </div>

      {/* AI Growth Explainer */}
      {growthData.length > 0 && patient && (
        <AIExplainerCard
          type="growth"
          context={{
            measurements: growthData.map((m) => {
              const ageMs = m.startDate - (patient.birthdate || 0)
              const ageMonths = Math.floor(ageMs / (30.44 * 24 * 60 * 60 * 1000))
              return {
                date: m.startDate,
                weight: m.weight,
                height: m.height,
                head: m.head,
                ageMonths,
              }
            }),
            patientSex: patient.sex,
            birthdate: patient.birthdate,
          }}
          patientId={patientId}
        />
      )}

      {/* Chart Navigation */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={goToPrev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="font-semibold text-foreground">{currentConfig.title}</h3>
          <Button variant="ghost" size="icon" onClick={goToNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {chartConfigs.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentIndex === index ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Chart */}
        {referenceData === undefined ? (
          <div className="flex items-center justify-center h-[350px]">
            <Spinner />
          </div>
        ) : chartData.length > 0 ? (
          <ChartPreview
            type={currentConfig.type}
            title={currentConfig.title}
            ylabel={currentConfig.ylabel}
            xlabel={currentConfig.xlabel}
            name={patientName}
            data={chartData}
            mesure={currentConfig.mesure}
            xUnit={currentConfig.xUnit}
            yUnit={currentConfig.yUnit}
          />
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground text-sm">
            No reference data available for this chart type.
          </div>
        )}
      </div>

      {/* Data Table */}
      <div>
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
          Measurements
        </h3>
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Age</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Weight (kg)</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Height (cm)</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Head (cm)</th>
              </tr>
            </thead>
            <tbody>
              {growthData
                .sort((a, b) => b.startDate - a.startDate)
                .map((measurement) => {
                  const ageMs = measurement.startDate - (patient?.birthdate || 0)
                  const ageMonths = Math.floor(ageMs / (30.44 * 24 * 60 * 60 * 1000))
                  const ageYears = Math.floor(ageMonths / 12)
                  const remainingMonths = ageMonths % 12
                  const ageStr = ageYears > 0
                    ? `${ageYears}y ${remainingMonths}m`
                    : `${ageMonths}m`

                  return (
                    <tr key={measurement._id} className="border-t border-border/50">
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(measurement.startDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{ageStr}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {measurement.weight ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {measurement.height ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {measurement.head ?? "-"}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
