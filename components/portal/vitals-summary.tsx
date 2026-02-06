"use client"

import { Ruler, Weight, Thermometer, Heart, Wind, Activity } from "lucide-react"

interface VitalsSummaryProps {
  height?: number
  weight?: number
  head?: number
  temperature?: number
  pulse?: number
  respiratory?: number
  systolic?: number
  diastolic?: number
  sao2?: number
}

const vitalConfig = [
  { key: "height", label: "Height", unit: "cm", icon: Ruler },
  { key: "weight", label: "Weight", unit: "kg", icon: Weight },
  { key: "head", label: "Head Circ.", unit: "cm", icon: Activity },
  { key: "temperature", label: "Temperature", unit: "°C", icon: Thermometer },
  { key: "pulse", label: "Pulse", unit: "bpm", icon: Heart },
  { key: "respiratory", label: "Respiratory", unit: "/min", icon: Wind },
  { key: "sao2", label: "SpO2", unit: "%", icon: Activity },
] as const

export function VitalsSummary(props: VitalsSummaryProps) {
  const activeVitals = vitalConfig.filter(
    (v) => props[v.key as keyof VitalsSummaryProps] !== undefined
  )

  if (activeVitals.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {activeVitals.map((vital) => {
        const value = props[vital.key as keyof VitalsSummaryProps]
        const Icon = vital.icon
        return (
          <div
            key={vital.key}
            className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-1"
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{vital.label}</span>
            </div>
            <p className="text-lg font-semibold">
              {value}
              <span className="text-xs font-normal text-muted-foreground ml-1">{vital.unit}</span>
            </p>
          </div>
        )
      })}
      {props.systolic !== undefined && props.diastolic !== undefined && (
        <div className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Heart className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Blood Pressure</span>
          </div>
          <p className="text-lg font-semibold">
            {props.systolic}/{props.diastolic}
            <span className="text-xs font-normal text-muted-foreground ml-1">mmHg</span>
          </p>
        </div>
      )}
    </div>
  )
}
