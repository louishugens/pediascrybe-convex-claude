import { CommonConditionsChartClient } from "@/components/dashboard/charts/CommonConditionsChartClient"
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

interface CommonConditionsProps {
  appointments: {
    _id: string;
    startDate: number;
    findings?: string | null;
  }[]
}

interface Condition {
  name: string
  count: number
}

// Define the response schema
const conditionsSchema = z.object({
  conditions: z.array(z.object({
    name: z.string(),
    count: z.number()
  }))
})

async function classifyAndCountConditions(diagnoses: string[]): Promise<Condition[]> {
  "use cache"
  
  if (diagnoses.length === 0) {
    return []
  }
  
  try {
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: conditionsSchema,
      prompt: `You are a pediatric diagnosis classifier. Analyze the provided medical findings and group them into common pediatric conditions. Return only a JSON array of objects with 'name' and 'count' properties, sorted by count in descending order. Limit to top 10 conditions and order from most common to least common. Here are the diagnoses: ${JSON.stringify(diagnoses)}`,
    })

    return result.object.conditions
  } catch (error) {
    console.error('Error classifying conditions:', error)
    return []
  }
}

export async function CommonConditionsChart({ appointments }: CommonConditionsProps) {
  const diagnoses = appointments.map(app => app.findings).filter(Boolean) as string[]
  const conditions = await classifyAndCountConditions(diagnoses)

  // Sort conditions by count descending
  const sortedConditions = [...conditions].sort((a, b) => b.count - a.count)

  return <CommonConditionsChartClient conditions={sortedConditions} />
} 