import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { generateText } from 'ai';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'GEMINI_API_KEY is not set. Add it to .env.local and restart the server.');
  }
  const google = createGoogleGenerativeAI({ apiKey });
  return google(process.env.GEMINI_MODEL || 'gemini-2.5-flash');
}

type ProviderOptions = NonNullable<Parameters<typeof generateText>[0]['providerOptions']>;

/**
 * Gemini 3.x models think before answering by default, which makes every call slow.
 * Thinking is switched off here unless GEMINI_THINKING_BUDGET says otherwise
 * (a number of tokens, or "default" to leave the model's own behaviour).
 */
export function thinkingOptions(): ProviderOptions | undefined {
  const raw = process.env.GEMINI_THINKING_BUDGET?.trim();
  if (raw === 'default') return undefined;
  const budget = raw ? Number(raw) : 0;
  if (!Number.isFinite(budget)) return undefined;
  return { google: { thinkingConfig: { thinkingBudget: budget } } };
}

let thinkingRejected = false;

function statusOf(err: unknown): number | undefined {
  const e = err as { statusCode?: number; lastError?: { statusCode?: number } } | null;
  return e?.statusCode ?? e?.lastError?.statusCode;
}

/**
 * Runs a Gemini call with thinking limited. Callers must pass maxRetries: 0 to generateText;
 * retries are handled here so a quota error (429) is not retried and does not burn more of the daily quota.
 * - 400 about "thinking": retries once without the thinking option.
 * - 503 (model busy): retries up to twice after a short pause.
 * - 429: throws a clear error with a code the browser can translate (quota or rate).
 */
export async function withThinkingFallback<T>(
  run: (providerOptions: ProviderOptions | undefined) => Promise<T>,
): Promise<T> {
  let options = thinkingRejected ? undefined : thinkingOptions();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await run(options);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      const status = statusOf(err);

      // Some models (for example the Flash-Lite ones) reject the thinking option with a generic
      // 400 "invalid argument". Retry once without it and remember that for the next calls.
      if (options && (status === 400 || /thinking/i.test(message))) {
        console.warn('[masar] The model rejected the thinking option; continuing without it.');
        thinkingRejected = true;
        options = undefined;
        continue;
      }
      if (status === 503 && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        continue;
      }
      if (status === 429) {
        const daily = /per ?day/i.test(message);
        console.warn(
          `[masar] Gemini ${daily ? 'daily quota' : 'rate limit'} reached for model ${process.env.GEMINI_MODEL || 'default'}. ` +
            'Wait for the reset, set GEMINI_MODEL to a model with free quota left, or enable billing in Google AI Studio.',
        );
        throw new ApiError(429, message, daily ? 'quota' : 'rate');
      }
      if (status === 503) throw new ApiError(503, message, 'busy');
      throw err;
    }
  }
  throw new ApiError(503, 'Gemini is busy right now.', 'busy');
}

/** Removes markdown code fences and extracts the first JSON object from model output. */
export function extractJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
  }
  throw new ApiError(502, 'Gemini returned a response that is not valid JSON. Try again.');
}

/** Verifies the Supabase access token sent by the browser and returns a client scoped to that user. */
export async function requireUser(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new ApiError(401, 'Sign in required.');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new ApiError(500, 'Supabase environment variables are not set.');

  const db = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, 'Your session expired. Sign in again.');
  return { user: data.user, db };
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
  console.error('[masar]', err);
  const message = err instanceof Error ? err.message : 'Unexpected server error.';
  const upstream = typeof (err as { statusCode?: number }).statusCode === 'number';
  return NextResponse.json({ error: message }, { status: upstream ? 502 : 500 });
}
