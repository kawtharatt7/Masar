import { supabase } from './supabase';

const FRIENDLY: Record<string, { en: string; ar: string }> = {
  quota: {
    en: 'The AI service has reached its daily limit. Please try again later.',
    ar: 'وصلت خدمة الذكاء الاصطناعي إلى حدها اليومي. حاول مرة أخرى لاحقًا.',
  },
  rate: {
    en: 'Too many requests in a short time. Wait a minute and try again.',
    ar: 'طلبات كثيرة في وقت قصير. انتظر دقيقة ثم حاول مرة أخرى.',
  },
  busy: {
    en: 'The AI service is busy right now. Please try again in a moment.',
    ar: 'خدمة الذكاء الاصطناعي مشغولة الآن. حاول مرة أخرى بعد قليل.',
  },
};

/** fetch() that attaches the current Supabase access token and throws the server's real error message. */
export async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('You are not signed in.');

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const friendly = body.code ? FRIENDLY[body.code as string] : undefined;
    const ar = typeof document !== 'undefined' && document.documentElement.lang === 'ar';
    throw new Error(friendly ? (ar ? friendly.ar : friendly.en) : body.error || `Request failed (${res.status})`);
  }
  return body as T;
}
