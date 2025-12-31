import OpenAI from 'openai'
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
  })

  const { prompt } = await req.json()
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview',
    messages: prompt
  })

  return new Response(JSON.stringify(response), {
    status: 200
  });
}