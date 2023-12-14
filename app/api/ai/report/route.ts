import OpenAI from 'openai'
// import { NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import supabase from '@/utils/supabase-rh';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers';
 

export const runtime = 'edge'
 
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})
 
export async function POST(req: Request) {

  // const supabase = createRouteHandlerClient({cookies});
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
  const { data: {session}, error } = await supabase.auth.getSession();

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
    model: 'gpt-4-1106-preview',
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
 
}