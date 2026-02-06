"use client"

import { useState } from "react"
import { useAction, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Sparkles, Loader2, Bot } from "lucide-react"
import { UpgradeDialog } from "./upgrade-dialog"

type ExplainerType = "medication" | "diagnostic" | "lab_exam" | "growth" | "vaccination"

interface AIExplainerCardProps {
  type: ExplainerType
  context: Record<string, unknown>
  patientId: Id<"patients">
  appointmentId?: Id<"appointments">
}

// Simple hash matching the backend
function hashContext(type: string, data: string): string {
  let hash = 0
  const str = `${type}:${data}`
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return `${type}_${hash.toString(36)}`
}

const typeLabels: Record<ExplainerType, string> = {
  medication: "Explain Prescription",
  diagnostic: "Explain Findings",
  lab_exam: "Explain Lab Exams",
  growth: "Explain Growth Data",
  vaccination: "Explain Vaccine",
}

export function AIExplainerCard({ type, context, patientId, appointmentId }: AIExplainerCardProps) {
  const contextJson = JSON.stringify(context)
  const contextHash = hashContext(type, contextJson)

  const cachedExplanation = useQuery(api.portalAi.getExplanation, { contextHash })
  const aiStatus = useQuery(api.portalAi.canUseAI)
  const requestExplanation = useAction(api.portalAi.requestExplanation)

  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  // Use cached explanation from DB if available
  const displayExplanation = explanation || cachedExplanation?.explanation

  const handleExplain = async () => {
    if (!aiStatus?.allowed && !aiStatus?.isPremium) {
      setShowUpgrade(true)
      return
    }

    setLoading(true)
    try {
      const result = await requestExplanation({
        type,
        context: contextJson,
        patientId,
        appointmentId,
      })
      setExplanation(result.explanation)
    } catch (error: any) {
      if (error.message?.includes("FREE_LIMIT_REACHED")) {
        setShowUpgrade(true)
      } else {
        console.error("AI explanation error:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (displayExplanation) {
    return (
      <Accordion type="single" collapsible defaultValue="explanation">
        <AccordionItem value="explanation" className="rounded-xl border border-primary/20 bg-primary/5 px-4 !border-b">
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Bot className="h-4 w-4" />
              <span>Scrybe Assist</span>
              {aiStatus?.isPremium && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Premium
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2">
              {displayExplanation.split("\n").map((line, i) => {
                if (line.startsWith("### ")) {
                  return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.replace("### ", "")}</h4>
                }
                if (line.startsWith("## ")) {
                  return <h3 key={i} className="font-semibold text-sm mt-3 mb-1">{line.replace("## ", "")}</h3>
                }
                if (line.startsWith("- ")) {
                  return (
                    <p key={i} className="text-muted-foreground pl-3 my-0.5">
                      {line}
                    </p>
                  )
                }
                if (line.trim() === "") return <br key={i} />
                return <p key={i} className="text-muted-foreground my-1">{line}</p>
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
        onClick={handleExplain}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {loading ? "Explaining..." : typeLabels[type]}
        {aiStatus && !aiStatus.isPremium && aiStatus.remaining >= 0 && (
          <span className="text-[10px] text-muted-foreground ml-1">
            ({aiStatus.remaining} left)
          </span>
        )}
      </Button>

      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} />
    </>
  )
}
