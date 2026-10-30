'use client';

import { useI18n } from '@/lib/i18n';

export function LangToggle() {
  const { lang, setLang } = useI18n();
  const next = lang === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      className="btn btn-quiet"
      onClick={() => setLang(next)}
      lang={next}
      aria-label={next === 'en' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      {next === 'en' ? 'English' : 'العربية'}
    </button>
  );
}
