'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import type { Achievement, ProfileRow } from '@/lib/types';
import { PixelAvatar, type AvatarKind } from './Avatar';
import { IdentityForm } from './Onboarding';

const BADGE_COLOR: Record<Achievement['kind'], string> = {
  project: 'bg-saffron',
  course: 'bg-fjord',
  certification: 'bg-teal',
};
const SLOTS = 8;

export function StudentCard({
  profile,
  achievements,
  score,
  stepsDone,
  stepsTotal,
  onProfileUpdate,
}: {
  profile: ProfileRow;
  achievements: Achievement[];
  score: number | null;
  stepsDone: number;
  stepsTotal: number;
  onProfileUpdate?: (p: ProfileRow) => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const level = achievements.length + 1;
  const avatar = (profile.avatar as AvatarKind | null) ?? 'boy';
  const name = profile.nickname || profile.full_name || '';
  const shown = achievements.slice(0, SLOTS);

  const stats: { label: string; value: string }[] = [
    { label: t('cardReadiness'), value: score === null ? '–' : `${score}%` },
    { label: t('cardSteps'), value: stepsTotal ? `${stepsDone}/${stepsTotal}` : '–' },
    { label: t('achievements'), value: String(achievements.length) },
  ];

  return (
    <div className="w-full max-w-[520px] self-center rounded-[22px] border-2 border-fjord bg-white p-6 shadow-[8px_8px_0_var(--saffron)] rtl:shadow-[-8px_8px_0_var(--saffron)] sm:p-7">
      {editing ? (
        <IdentityForm
          initial={profile}
          submitLabel={t('saveContinue')}
          onCancel={() => setEditing(false)}
          onSaved={(p) => {
            onProfileUpdate?.(p);
            setEditing(false);
          }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-5">
            <PixelAvatar kind={avatar} size={104} label={name} bob />
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="self-start rounded-full bg-fjord px-3 py-0.5 text-xs font-semibold text-salt">
                {t('cardLevel', { n: level })}
              </span>
              <h2 className="truncate text-2xl">{name}</h2>
              <p className="text-sm text-muted-foreground">
                {[profile.major, profile.academic_year ? t('cardYear', { n: profile.academic_year }) : '']
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>

          {profile.target_role && (
            <div className="rounded-xl border-[1.5px] border-dashed border-mist px-4 py-3">
              <p className="text-[13px] font-medium text-muted-foreground">{t('targetRole')}</p>
              <p className="font-[family-name:var(--display)] text-lg font-bold text-fjord">{profile.target_role}</p>
            </div>
          )}

          <ul className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <li key={s.label} className="flex flex-col items-center gap-0.5 rounded-xl bg-salt px-2 py-3 text-center">
                <span className="font-[family-name:var(--display)] text-2xl font-bold text-fjord">{s.value}</span>
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-fjord">{t('achievements')}</p>
            <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {Array.from({ length: SLOTS }, (_, i) => {
                const a = shown[i];
                return a ? (
                  <motion.li
                    key={a.id}
                    title={a.project_title}
                    aria-label={a.project_title}
                    className={`aspect-square rounded-lg ${BADGE_COLOR[a.kind]} shadow-[inset_0_-4px_0_rgba(0,0,0,0.18)]`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.1 + i * 0.05 }}
                  />
                ) : (
                  <li key={`e${i}`} aria-hidden="true" className="aspect-square rounded-lg border-[1.5px] border-dashed border-mist" />
                );
              })}
            </ul>
            {achievements.length === 0 && <p className="hint">{t('cardNoAch')}</p>}
          </div>

          <div>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>
              {t('cardChange')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** The card in a pop-up, opened from the round profile button in the header. */
export function CardDialog({ onClose, ...card }: { onClose: () => void } & Parameters<typeof StudentCard>[0]) {
  const { t } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start gap-4 overflow-y-auto bg-fjord/70 p-4 pt-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label={t('cardTitle')}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <StudentCard {...card} />
      <button type="button" className="btn btn-quiet !text-salt hover:!bg-white/10" onClick={onClose} autoFocus>
        {t('close')}
      </button>
    </motion.div>
  );
}
