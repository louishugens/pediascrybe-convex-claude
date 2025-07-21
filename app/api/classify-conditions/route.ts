import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'; 
import { z } from 'zod';

// Define the response schema
const conditionsSchema = z.object({
  conditions: z.array(z.object({
    name: z.string(),
    count: z.number()
  }))
});

const redis = Redis.fromEnv();

export async function POST(req: Request) {
  try {
    const { diagnoses } = await req.json()
    
    // Check cache first
    const cacheKey = `conditions-${JSON.stringify(diagnoses).slice(0, 32)}`
    const cached = await redis.get(cacheKey)
    if (cached && typeof cached === 'string') return NextResponse.json(JSON.parse(cached))

    // console.log('diagnoses', diagnoses)
    const result = await generateObject({
      model: openai('gpt-4.1-nano'),
      // model: openai('gpt-4o-mini'), 
      schema: conditionsSchema,
      prompt: `You are a pediatric diagnosis classifier. Analyze the provided medical findings and group them into common pediatric conditions. Return only a JSON array of objects with 'name' and 'count' properties, sorted by count in descending order. Limit to top 10 conditions and order from most common to least common. Here are the diagnoses: ${JSON.stringify(diagnoses)}`,
    })  

    const conditions = result.object.conditions;

    // Cache the results for 1 day
    await redis.set(cacheKey, JSON.stringify(conditions), { ex: 60 * 60 * 24 })

    return NextResponse.json(conditions)
  } catch (error) {
    console.error('Error classifying conditions:', error) 
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 })
  }
} 

