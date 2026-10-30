import { NextResponse } from 'next/server';
import { generateText, type CoreMessage } from 'ai';
import type { z } from 'zod';
import { ApiError, errorResponse, extractJson, getModel, requireUser, withThinkingFallback } from '@/lib/server';
import { CoreSchema, PlanSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

// One request per analysis by default (saves daily quota). Set GEMINI_SPLIT_ANALYSIS=true for two
// parallel requests, which is faster but uses twice the quota.
const FullSchema = CoreSchema.merge(PlanSchema);
const SPLIT = process.env.GEMINI_SPLIT_ANALYSIS === 'true';

const MAX_PDF_BYTES = 4 * 1024 * 1024;
const MAX_TEXT_CHARS = 20000;
const SYSTEM =
  'You are a precise career analyst for students of every field. You answer with a single JSON object and nothing else.';

async function ask<S extends z.ZodTypeAny>(
  prompt: string,
  schema: S,
  pdf: Uint8Array | null,
  maxTokens = 4096,
): Promise<z.infer<S>> {
  const content: Extract<CoreMessage, { role: 'user' }>['content'] = [{ type: 'text', text: prompt }];
  if (pdf) content.push({ type: 'file', data: pdf, mimeType: 'application/pdf' });

  const result = await withThinkingFallback((providerOptions) =>
    generateText({
      model: getModel(),
      providerOptions,
      maxRetries: 0,
      temperature: 0.3,
      maxTokens,
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    }),
  );

  const parsed = schema.safeParse(extractJson(result.text));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(502, `Gemini returned JSON in an unexpected shape: ${issue?.path.join('.')} ${issue?.message}`);
  }
  return parsed.data;
}

export async function POST(req: Request) {
  const started = Date.now();
  try {
    const { user, db } = await requireUser(req);
    const form = await req.formData();
    const language = form.get('lang') === 'ar' ? 'Arabic' : 'English';
    const text = String(form.get('text') ?? '').trim().slice(0, MAX_TEXT_CHARS);
    const file = form.get('file');

    // The profile is the source of truth for role, major, courses and skills.
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('major, academic_year, target_role, courses, skills')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw new ApiError(500, `Could not read your profile: ${profileError.message}`);
    const targetRole = profile?.target_role?.trim();
    if (!targetRole) throw new ApiError(400, 'Set a target role in your profile first.');

    const courses: string[] = profile?.courses ?? [];
    const skills: string[] = profile?.skills ?? [];

    let pdf: Uint8Array | null = null;
    if (file instanceof File && file.size > 0) {
      if (file.type !== 'application/pdf') throw new ApiError(400, 'Only PDF files are supported.');
      if (file.size > MAX_PDF_BYTES) throw new ApiError(413, 'The PDF is larger than 4 MB.');
      pdf = new Uint8Array(await file.arrayBuffer());
    }
    const hasCvText = text.length >= 40;
    if (!pdf && !hasCvText && courses.length + skills.length === 0) {
      throw new ApiError(400, 'Add skills or courses to your profile, or provide a CV.');
    }

    const context = `Target role: ${targetRole}
Major: ${profile?.major || 'not specified'}
Academic year: ${profile?.academic_year ?? 'not specified'} (1 = first year, 5 = final or later)
Completed courses: ${courses.length ? courses.join('; ') : 'none listed'}
Skills the student reports: ${skills.length ? skills.join('; ') : 'none listed'}
${pdf ? 'A CV is attached as a PDF.' : hasCvText ? `CV text:\n"""\n${text}\n"""` : 'No CV was provided; rely on the courses and skills above.'}`;

    const style = `- Base everything only on the information above. Never invent experience, projects, or credentials.
- Keep every sentence short and plain. Be concise: brevity matters more than detail.
- Write every human-readable value in ${language}. Keep the JSON keys in English. Keep proper nouns (course titles, providers, tools, certification names) in their original language.
- Return a single JSON object with exactly the shape below and nothing else (no markdown, no code fences).`;

    const corePrompt = `Assess how ready this student is for a target role.

${context}

Rules:
${style}
- matchScore: integer 0 to 100, how close the student is today to being hireable for the role at entry level.
- summary: 2 sentences on where the student stands.
- marketInsight: 2 sentences on what employers typically expect for this role and which skills are most requested. This is a general outlook from industry knowledge, not live job-posting data; do not claim live data.
- strengths: up to 5, each backed by evidence from the information above.
- gaps: 4 to 6, importance "high", "medium" or "low".
- skills: 6 to 8 skills the role requires; "have" = student's current level 0-100, "need" = level an entry-level hire needs 0-100.

Shape:
{
  "summary": "",
  "marketInsight": "",
  "matchScore": 0,
  "strengths": [{ "skill": "", "evidence": "" }],
  "gaps": [{ "skill": "", "importance": "high", "reason": "" }],
  "skills": [{ "name": "", "have": 0, "need": 0 }]
}`;

    const planPrompt = `Build a learning plan that takes this student from where they are to being ready for the target role. Focus on what the student is missing.

${context}

Rules:
${style}
- roadmap: 5 to 6 ordered steps. Each has a duration like "2 weeks", a one-sentence description, 3 to 4 "topics" to study, 2 to 3 concrete "actions", and one "projectIdea": a specific small project the student can finish and show to others, suited to the student's field (it does not have to be software).
- courses: 4 real, well-known courses or learning programs with the real provider (for example Coursera, edX, Udemy, Khan Academy, a university). No URLs.
- certifications: 2 to 3 recognised certifications relevant to the role.

Shape:
{
  "roadmap": [{ "title": "", "duration": "", "description": "", "topics": [""], "actions": [""], "projectIdea": "" }],
  "courses": [{ "title": "", "provider": "", "skill": "", "level": "" }],
  "certifications": [{ "name": "", "issuer": "", "why": "" }]
}`;

    const fullPrompt = `Assess how ready this student is for a target role, then build a learning plan that closes the gap.

${context}

Rules:
${style}
- matchScore: integer 0 to 100, how close the student is today to being hireable for the role at entry level.
- summary: 2 sentences on where the student stands.
- marketInsight: 2 sentences on what employers typically expect for this role and which skills are most requested. This is a general outlook from industry knowledge, not live job-posting data; do not claim live data.
- strengths: up to 5, each backed by evidence from the information above.
- gaps: 4 to 6, importance "high", "medium" or "low".
- skills: 6 to 8 skills the role requires; "have" = student's current level 0-100, "need" = level an entry-level hire needs 0-100.
- roadmap: 5 to 6 ordered steps. Each has a duration like "2 weeks", a one-sentence description, 3 to 4 "topics" to study, 2 to 3 concrete "actions", and one "projectIdea": a specific small project the student can finish and show to others, suited to the student's field (it does not have to be software).
- courses: 4 real, well-known courses or learning programs with the real provider (for example Coursera, edX, Udemy, Khan Academy, a university). No URLs.
- certifications: 2 to 3 recognised certifications relevant to the role.

Shape:
{
  "summary": "",
  "marketInsight": "",
  "matchScore": 0,
  "strengths": [{ "skill": "", "evidence": "" }],
  "gaps": [{ "skill": "", "importance": "high", "reason": "" }],
  "skills": [{ "name": "", "have": 0, "need": 0 }],
  "roadmap": [{ "title": "", "duration": "", "description": "", "topics": [""], "actions": [""], "projectIdea": "" }],
  "courses": [{ "title": "", "provider": "", "skill": "", "level": "" }],
  "certifications": [{ "name": "", "issuer": "", "why": "" }]
}`;

    const combined = SPLIT
      ? await Promise.all([ask(corePrompt, CoreSchema, pdf), ask(planPrompt, PlanSchema, pdf)]).then(([c, p]) => ({
          ...c,
          ...p,
        }))
      : await ask(fullPrompt, FullSchema, pdf, 7000);

    const analysis = {
      ...combined,
      roadmap: combined.roadmap.map((step, i) => ({ ...step, id: `s${i + 1}` })),
    };

    const { error: saveError } = await db.from('progress').upsert(
      {
        user_id: user.id,
        target_role: targetRole,
        match_score: analysis.matchScore,
        analysis,
        completed_steps: [],
        learning: [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (saveError) throw new ApiError(500, `Could not save your analysis: ${saveError.message}`);

    const { error: historyError } = await db
      .from('score_history')
      .insert({ user_id: user.id, target_role: targetRole, score: analysis.matchScore });
    if (historyError) throw new ApiError(500, `Could not save your score history: ${historyError.message}`);

    console.log(`[masar] analysis finished in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.log(`[masar] analysis failed after ${((Date.now() - started) / 1000).toFixed(1)}s`);
    return errorResponse(err);
  }
}
