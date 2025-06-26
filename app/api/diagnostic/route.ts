import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})
 
export async function POST(req: Request) {


  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
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

  console.log('response :>> ', response.choices[0].message);

  return new Response(JSON.stringify(response.choices[0].message.content), {
    status: 200
  });

}