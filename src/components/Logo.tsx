'use client';

import { useI18n } from '@/lib/i18n';

export function Logo({ size = 34, word = true }: { size?: number; word?: boolean }) {
  const { lang } = useI18n();
  return (
    <span className="logo">
      <svg className="logo-mark" width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path
          d="M9 38C9 25 24 29 24 19C24 12 30 10 38 10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="9" cy="38" r="4.5" fill="currentColor" />
        <circle cx="38" cy="10" r="6" fill="var(--saffron)" />
      </svg>
      {word && <span className="logo-word">{lang === 'ar' ? 'مسار' : 'Masar'}</span>}
    </span>
  );
}
