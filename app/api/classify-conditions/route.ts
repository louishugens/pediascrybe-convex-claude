import { streamText, Output } from 'ai';
import { z } from 'zod';
import {
  getModelWithFallbacks,
  getCachedOrGenerate,
  hashInputs,
  handleAIError,
} from '@/lib/ai';

// Define the element schema for the conditions array
const conditionElementSchema = z.object({
  name: z.string(),
  count: z.number(),
});

export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const { diagnoses } = await req.json();

    // Generate cache key from diagnoses
    const cacheKey = `conditions:${hashInputs({ diagnoses })}`;

    // Use cached result or generate new one
    const conditions = await getCachedOrGenerate(
      cacheKey,
      async () => {
        // Get fast tier model with fallbacks
        const { model, providerOptions } = getModelWithFallbacks('fast');

        const result = streamText({
          model,
          providerOptions,
          output: Output.array({
            element: conditionElementSchema,
          }),
          prompt: `You are a pediatric diagnosis classifier. Analyze the provided medical findings and group them into common pediatric conditions. Return a JSON array of objects with 'name' and 'count' properties, sorted by count in descending order. Limit to top 10 conditions and order from most common to least common. Here are the diagnoses: ${JSON.stringify(diagnoses)}`,
        });

        // Wait for the stream to complete and get the final array
        const content = await result.content;
        return content;
      },
      { ttlSeconds: 60 * 60 * 24 } // 1 day cache
    );

    return new Response(JSON.stringify(conditions), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error classifying conditions:', error);
    return handleAIError(error);
  }
}
