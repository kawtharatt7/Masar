import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { ApiError, errorResponse, extractJson, getModel, requireUser, withThinkingFallback } from '@/lib/server';
import { RolesSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Answers = { enjoy?: string[]; environment?: string[]; values?: string[]; style?: string[]; notes?: string };

const list = (v?: string[]) => (v && v.length ? v.join(', ') : 'not specified');

export async function POST(req: Request) {
  try {
    await requireUser(req);

    const body = (await req.json().catch(() => null)) as {
      major?: string;
      year?: number;
      interests?: string;
      answers?: Answers;
      lang?: string;
    } | null;

    const major = body?.major?.trim();
    if (!major) throw new ApiError(400, 'major is required.');
    const year = Number(body?.year) || 1;
    const interests = body?.interests?.trim() || 'not specified';
    const language = body?.lang === 'ar' ? 'Arabic' : 'English';
    const a = body?.answers;
    const answers = a
      ? `The student is unsure what they want and answered a short questionnaire:
- Enjoys: ${list(a.enjoy)}
- Preferred workplaces: ${list(a.environment)}
- Values at work: ${list(a.values)}
- Working style: ${list(a.style)}
- Notes: ${a.notes?.trim() || 'none'}`
      : '';

    const { text } = await withThinkingFallback((providerOptions) =>
      generateText({
        model: getModel(),
        providerOptions,
        maxRetries: 0,
        temperature: 0.5,
        maxTokens: 2048,
        system:
          'You are a career advisor for university students of every field. You answer with a single JSON object and nothing else: no markdown, no code fences, no commentary.',
        prompt: `A university student needs help choosing a target role.

Major: ${major}
Academic year: ${year} (1 = first year, 5 = final or later)
Skills or interests: ${interests}
${answers}

Suggest 5 realistic roles this student could reach within a year or two of graduating. Roles can be in the student's own field or a closely related one; do not assume a technology field unless the major or answers point to it. Prefer concrete job titles over broad fields. Order them from best fit to weakest fit. In "why", connect the role to the student's major${a ? ' and answers' : ''}.

Write every human-readable value in ${language}. Keep the JSON keys in English.

Return exactly this shape:
{
  "roles": [
    {
      "title": "job title",
      "why": "one sentence on why it fits",
      "demand": "high" | "medium" | "low",
      "skills": ["3 to 5 core skills the role requires"]
    }
  ]
}`,
      }),
    );

    const parsed = RolesSchema.safeParse(extractJson(text));
    if (!parsed.success) {
      throw new ApiError(502, `Gemini returned roles in an unexpected shape: ${parsed.error.issues[0]?.message}`);
    }
    return NextResponse.json({ roles: parsed.data.roles.slice(0, 6) });
  } catch (err) {
    return errorResponse(err);
  }
}
