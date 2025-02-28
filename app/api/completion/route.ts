 
import OpenAI from 'openai'
// import { OpenAIStream, StreamingTextResponse } from 'ai'
import { NextResponse } from 'next/server';
 
console.log('test :>> ');
// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = 'edge'
 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})
 
export async function POST(req: Request) {

  const { prompt } = await req.json()
 
  
  const response = await openai.chat.completions.create({
    // model: 'gpt-3.5-turbo',
    model: 'gpt-4-1106-preview',
    // stream: true,
    messages: prompt
  })

  return new Response(JSON.stringify(response), {
    status: 200
});
 
  console.log('response :>> ', response);
  // Convert the response into a friendly text-stream
  // const stream = OpenAIStream(response)
 
  // Respond with the stream
  // return new StreamingTextResponse(stream)
}