import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import { ApiError, errorResponse, extractJson, getModel, requireUser, withThinkingFallback } from '@/lib/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SuggestSchema = z.object({
  courses: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    await requireUser(req);
    const body = (await req.json().catch(() => null)) as { major?: string; lang?: string } | null;
    const major = body?.major?.trim();
    if (!major) throw new ApiError(400, 'major is required.');
    const language = body?.lang === 'ar' ? 'Arabic' : 'English';

    const { text } = await withThinkingFallback((providerOptions) =>
      generateText({
        model: getModel(),
        providerOptions,
        maxRetries: 0,
        temperature: 0.3,
        maxTokens: 1024,
        system: 'You answer with a single JSON object and nothing else: no markdown, no code fences.',
        prompt: `A university student studies "${major}". List:
- "courses": 10 courses students of this major typically take (short names, 1 to 5 words).
- "skills": 10 skills students of this major typically gain (technical or professional, 1 to 3 words).

Write the values in ${language}. Keep tool or software names in their original language. Keep the JSON keys in English.
Shape: { "courses": [""], "skills": [""] }`,
      }),
    );

    const parsed = SuggestSchema.safeParse(extractJson(text));
    if (!parsed.success) throw new ApiError(502, 'Gemini returned suggestions in an unexpected shape.');
    return NextResponse.json({
      courses: parsed.data.courses.slice(0, 12),
      skills: parsed.data.skills.slice(0, 12),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
