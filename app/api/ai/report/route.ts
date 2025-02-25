import OpenAI from 'openai'
import { createClient } from '@/utils/supabase/server'
 

export const runtime = 'edge'
 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})
 
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: {session}, error } = await (await supabase).auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({
          error: { statusCode: 500, message: 'Session is not defined' }
        }),
        { status: 500 }
      );
    }

    const { messages } = await req.json()

    console.log('messages :>> ', messages);

    
    const response = await openai.chat.completions.create({
      // model: 'gpt-3.5-turbo',
      model: 'gpt-4o-mini',
      // stream: true,
      messages: messages
    })

    console.log('response :>> ', response);

    if (!response) {
      return new Response(JSON.stringify(response), {
        status: 500
      });
    }

    return new Response(JSON.stringify(response.choices[0].message.content), {
      status: 200
    });
  } catch (error) {
    // ... error handling
  }
}