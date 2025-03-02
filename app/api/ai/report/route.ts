import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { createClient } from '@/utils/supabase/server'
 
 
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

    // console.log('messages :>> ', messages);

    
    const textStream = await streamText({
      model: openai('gpt-4o-mini'),
      messages
    })

    // console.log('response :>> ', response);

    if (!textStream) {
      return new Response(JSON.stringify(textStream), {
        status: 500
      });
    }

    // console.log('textStream :>> ', textStream);

    return textStream.toTextStreamResponse()
  } catch (error) {
    console.error('Error in report generation:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate report' }),
      { status: 500 }
    )
  }
}