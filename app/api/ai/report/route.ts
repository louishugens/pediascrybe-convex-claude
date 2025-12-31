import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { isAuthenticated } from '@/lib/auth-server'

export async function POST(req: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return new Response(
        JSON.stringify({
          error: { statusCode: 401, message: 'Not authenticated' }
        }),
        { status: 401 }
      );
    }

    const { messages } = await req.json()

    const textStream = await streamText({
      model: openai('gpt-4o-mini'),
      messages
    })

    if (!textStream) {
      return new Response(JSON.stringify(textStream), {
        status: 500
      });
    }

    return textStream.toTextStreamResponse()
  } catch (error) {
    console.error('Error in report generation:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate report' }),
      { status: 500 }
    )
  }
}
