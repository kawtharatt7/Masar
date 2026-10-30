'use client';

import { motion } from 'framer-motion';
import { useI18n, type Key } from '@/lib/i18n';

// Demo numbers for the landing page: your level and what the role needs, both out of 100.
// Sorted by the size of the gap, biggest first.
const ROWS: { name: string; have: number; need: number }[] = [
  { name: 'AWS', have: 0, need: 75 },
  { name: 'Terraform', have: 0, need: 70 },
  { name: 'Docker', have: 10, need: 80 },
  { name: 'CI/CD', have: 10, need: 75 },
  { name: 'Git', have: 60, need: 80 },
  { name: 'Python', have: 60, need: 75 },
  { name: 'Linux', have: 70, need: 85 },
];

function tagFor(have: number, need: number): Key {
  if (have === 0) return 'heroTagNone';
  return need - have >= 60 ? 'heroTagStart' : 'heroTagClose';
}

export function HeroCard() {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-[520px] justify-self-center rounded-[22px] border-2 border-fjord bg-white p-5 shadow-[6px_6px_0_var(--saffron)] rtl:shadow-[-6px_6px_0_var(--saffron)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-muted-foreground">{t('targetRole')}</span>
          <span className="font-[family-name:var(--display)] text-xl font-bold text-fjord">DevOps Engineer</span>
        </div>
        <span className="text-sm font-semibold text-[#c23a14]">{t('heroSummary')}</span>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {ROWS.map((r, i) => (
          <li key={r.name} className="flex items-center gap-3.5">
            <span className="w-[84px] shrink-0 text-start text-sm font-semibold text-fjord">
              <bdi>{r.name}</bdi>
            </span>
            <div
              role="img"
              aria-label={`${r.name}: ${r.have}% / ${r.need}%`}
              className="relative h-2.5 min-w-0 flex-1 rounded-full bg-mist"
            >
              <motion.div
                className="absolute inset-y-0 start-0 rounded-full bg-fjord"
                initial={{ width: 0 }}
                animate={{ width: `${r.have}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 + i * 0.08 }}
              />
              <motion.div
                className={`absolute inset-y-0 bg-saffron ${r.have === 0 ? 'rounded-full' : 'rounded-e-full'}`}
                style={{ insetInlineStart: `${r.have}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${r.need - r.have}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.6 + i * 0.08 }}
              />
            </div>
            <span className="w-[84px] shrink-0 text-end text-xs font-semibold text-muted-foreground">
              {t(tagFor(r.have, r.need))}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t-[1.5px] border-dashed border-mist pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-[22px] rounded-full bg-fjord" />
          {t('strengths')}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-[22px] rounded-full bg-saffron" />
          {t('gaps')}
        </span>
      </div>
    </div>
  );
}
