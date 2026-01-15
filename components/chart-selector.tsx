"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Baby, User, Activity } from "lucide-react"

interface ChartOption {
  type: string
  title: string
  description: string
  recommended: boolean
}

interface ChartSelectorData {
  type: 'chartSelector'
  patientAge: number
  availableData: {
    hasWeight: boolean
    hasHeight: boolean
    hasHeadCircumference: boolean
    appointmentCount: number
  }
  availableCharts: ChartOption[]
  recommendedCharts: ChartOption[]
  showOptions: boolean
  context: string
  message: string
  error?: string
}

interface ChartSelectorProps {
  data: ChartSelectorData
  onChartSelect?: (chartType: string) => void
}

const getChartIcon = (chartType: string) => {
  switch (chartType) {
    case 'wfa':
    case 'wfl':
    case 'wfl0To2':
      return <TrendingUp className="w-4 h-4" />
    case 'hfa':
    case 'hfa5To19':
      return <User className="w-4 h-4" />
    case 'bfa':
    case 'bfa5To19':
      return <Activity className="w-4 h-4" />
    case 'hcfa':
      return <Baby className="w-4 h-4" />
    default:
      return <TrendingUp className="w-4 h-4" />
  }
}

function ChartSelectorInner({ data, onChartSelect }: ChartSelectorProps) {
  if (data.error) {
    return (
      <Card className="w-full max-w-2xl mx-auto mb-4">
        <CardContent className="py-4">
          <div className="text-center text-red-600">
            <p>Error: {data.error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mb-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Growth Chart Selection
        </CardTitle>
        <p className="text-sm text-muted-foreground">{data.message}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            Age: {data.patientAge} years
          </Badge>
          <Badge variant="outline" className="text-xs">
            {data.availableData.appointmentCount} appointments
          </Badge>
          {data.availableData.hasWeight && (
            <Badge variant="secondary" className="text-xs">Weight data</Badge>
          )}
          {data.availableData.hasHeight && (
            <Badge variant="secondary" className="text-xs">Height data</Badge>
          )}
          {data.availableData.hasHeadCircumference && (
            <Badge variant="secondary" className="text-xs">Head circumference data</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.availableCharts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No growth charts available for this patient.</p>
            <p className="text-sm mt-1">Patient needs weight, height, or head circumference measurements.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recommendedCharts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-primary mb-2">Recommended Charts</h4>
                <div className="grid gap-2">
                  {data.recommendedCharts.map((chart) => (
                    <Button
                      key={chart.type}
                      variant="default"
                      className="justify-start h-auto p-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                      onClick={() => onChartSelect?.(chart.type)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        {getChartIcon(chart.type)}
                        <div className="text-left flex-1">
                          <div className="font-medium">{chart.title}</div>
                          <div className="text-xs opacity-80">{chart.description}</div>
                        </div>
                        <Badge className="bg-primary text-primary-foreground">Recommended</Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {data.availableCharts.filter(chart => !chart.recommended).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Other Available Charts</h4>
                <div className="grid gap-2">
                  {data.availableCharts
                    .filter(chart => !chart.recommended)
                    .map((chart) => (
                      <Button
                        key={chart.type}
                        variant="outline"
                        className="justify-start h-auto p-3"
                        onClick={() => onChartSelect?.(chart.type)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          {getChartIcon(chart.type)}
                          <div className="text-left flex-1">
                            <div className="font-medium">{chart.title}</div>
                            <div className="text-xs text-muted-foreground">{chart.description}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Wrap with memo to prevent unnecessary re-renders
const ChartSelector = memo(ChartSelectorInner, (prevProps, nextProps) => {
  return (
    prevProps.data.type === nextProps.data.type &&
    prevProps.data.patientAge === nextProps.data.patientAge &&
    prevProps.data.availableCharts.length === nextProps.data.availableCharts.length &&
    prevProps.data.message === nextProps.data.message &&
    prevProps.onChartSelect === nextProps.onChartSelect
  )
})

export default ChartSelector