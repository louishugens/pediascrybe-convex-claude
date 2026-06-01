import { generateObject } from 'ai';
import { z } from 'zod';
import { checkBotId } from 'botid/server';
import { isAuthenticated, fetchAuthMutation } from '@/lib/auth-server';
import { api } from '@/convex/_generated/api';
import { aiRateLimit, checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getModelWithFallbacks, handleAIError } from '@/lib/ai';

export const maxDuration = 60;

const extractedSchema = z.object({
  results: z
    .array(
      z.object({
        examName: z
          .string()
          .describe(
            'Name of the test or measurement this value belongs to. Use the exact term as it appears on the report (e.g. "Hemoglobin", "WBC", "TSH"). For panels, list each component as its own item.',
          ),
        value: z
          .string()
          .describe(
            'The measured value as a string. Numeric, qualitative ("positive"), ranges ("<0.01"), or categorical ("A+") all valid.',
          ),
        unit: z.string().optional().describe('Unit of measurement (e.g. "g/dL").'),
        referenceRange: z
          .string()
          .optional()
          .describe('Reference range as printed (e.g. "12-16", ">10", "negative").'),
        abnormalFlag: z
          .enum(['normal', 'low', 'high', 'critical'])
          .optional()
          .describe(
            'Flag the lab printed (H/L/Critical). Omit if not specified or if value is within range.',
          ),
        notes: z.string().optional().describe('Any qualifying note printed alongside the result.'),
      }),
    )
    .describe('All distinct measurements found in the document.'),
});

export async function POST(req: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return new Response(
      JSON.stringify({ error: { statusCode: 401, message: 'Not authenticated' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const ip = await getClientIp();
  const rateLimitResponse = await checkRateLimit(aiRateLimit, ip);
  if (rateLimitResponse) return rateLimitResponse;

  const verification = await checkBotId();
  if (verification.isBot) {
    return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  const orderedExamsRaw = formData.get('orderedExams');

  if (!(file instanceof File)) {
    return new Response(
      JSON.stringify({ error: { statusCode: 400, message: 'Missing file' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const mediaType = file.type || 'application/octet-stream';
  const isImage = mediaType.startsWith('image/');
  const isPdf = mediaType === 'application/pdf';
  if (!isImage && !isPdf) {
    return new Response(
      JSON.stringify({
        error: { statusCode: 400, message: 'Only PDF and image files are supported.' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const orderedExams: string[] =
    typeof orderedExamsRaw === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(orderedExamsRaw);
            return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
          } catch {
            return [];
          }
        })()
      : [];

  // Deduct AI credits up front (4 — heavier than diagnostic given vision + structured output).
  try {
    await fetchAuthMutation(api.usage.deductAICredits, { feature: 'lab_exam' });
  } catch (err: any) {
    if (err?.message?.includes('NO_CREDITS')) {
      return new Response(
        JSON.stringify({
          error: {
            statusCode: 402,
            message: 'Out of AI credits. Buy a credit pack or upgrade your plan.',
          },
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  const { model, providerOptions } = getModelWithFallbacks('powerful');

  const orderedExamsHint = orderedExams.length
    ? `\n\nThe doctor ordered the following exams for this visit. When you extract a value, set examName to the entry from this list it best matches; otherwise use the term as printed on the report.\n- ${orderedExams.join('\n- ')}`
    : '';

  try {
    const { object } = await generateObject({
      model,
      providerOptions,
      schema: extractedSchema,
      messages: [
        {
          role: 'system',
          content:
            'You are a medical lab report parser. Extract every distinct measurement (test, analyte, observation) from the supplied document. Do not invent values that are not on the page. If a panel has multiple components, list each as its own item. Preserve the exact value, unit, and reference range as printed.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract all lab results from the attached ${isPdf ? 'PDF' : 'image'} report.${orderedExamsHint}`,
            },
            isPdf
              ? {
                  type: 'file' as const,
                  data: bytes,
                  mediaType: 'application/pdf',
                }
              : {
                  type: 'image' as const,
                  image: bytes,
                  mediaType,
                },
          ],
        },
      ],
    });

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleAIError(error);
  }
}
