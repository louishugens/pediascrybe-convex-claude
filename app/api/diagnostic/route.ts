import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})
 
export async function POST(req: Request) {


  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    // model: 'gpt-4',
    temperature: 0.0,
    // stream: true,
    messages: messages
  })

  

  if (!response) {
    return new Response(JSON.stringify(response), {
      status: 500
    });
  }

  return new Response(JSON.stringify(response.choices[0].message.content), {
    status: 200
  });

}