'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import type { Analysis } from '@/lib/schemas';
import type { Achievement } from '@/lib/types';
import { certKey, courseKey } from '@/lib/learning';
import { CompletionForm, type CompletionValues } from './CompletionForm';

const search = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

export function LearningSection({
  courses,
  certifications,
  achievements,
  learning,
  onToggleLearning,
  onComplete,
}: {
  courses: Analysis['courses'];
  certifications: Analysis['certifications'];
  achievements: Achievement[];
  learning: string[];
  onToggleLearning: (key: string) => void;
  onComplete: (
    kind: 'course' | 'certification',
    key: string,
    title: string,
    provider: string,
    skill: string,
    values: CompletionValues,
  ) => Promise<boolean>;
}) {
  const { t } = useI18n();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function complete(
    kind: 'course' | 'certification',
    key: string,
    title: string,
    provider: string,
    skill: string,
    values: CompletionValues,
  ) {
    setBusy(true);
    const ok = await onComplete(kind, key, title, provider, skill, values);
    setBusy(false);
    if (ok) setOpenKey(null);
  }

  function Item({
    kind,
    itemKey,
    title,
    provider,
    meta,
    note,
    skill,
  }: {
    kind: 'course' | 'certification';
    itemKey: string;
    title: string;
    provider: string;
    meta: string;
    note?: string;
    skill: string;
  }) {
    const done = achievements.some((a) => a.step_id === itemKey);
    const inProgress = learning.includes(itemKey);
    return (
      <li className="line">
        <div className="flex items-start justify-between gap-3">
          <strong>{title}</strong>
          {done ? (
            <span className="tag tag-high">{kind === 'course' ? t('doneTag') : t('earnedTag')}</span>
          ) : inProgress ? (
            <span className="tag">{t('learningNow')}</span>
          ) : null}
        </div>
        {meta && <span>{meta}</span>}
        {note && <span>{note}</span>}
        {!done && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a className="link" href={search(`${title} ${provider}`)} target="_blank" rel="noopener noreferrer">
              {kind === 'course' ? t('findCourse') : t('findCert')}
            </a>
            {inProgress ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary px-4 py-1.5 text-sm"
                  onClick={() => setOpenKey(openKey === itemKey ? null : itemKey)}
                >
                  {kind === 'course' ? t('iDidIt') : t('iEarned')}
                </button>
                <button type="button" className="link text-sm" onClick={() => onToggleLearning(itemKey)}>
                  {t('cancel')}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-outline px-4 py-1.5 text-sm" onClick={() => onToggleLearning(itemKey)}>
                {t('startLearning')}
              </button>
            )}
          </div>
        )}
        {!done && openKey === itemKey && (
          <CompletionForm
            kind={kind}
            busy={busy}
            onCancel={() => setOpenKey(null)}
            onSubmit={(v) => complete(kind, itemKey, title, provider, skill, v)}
          />
        )}
      </li>
    );
  }

  return (
    <div className="columns">
      <section className="stack">
        <h2>{t('courses')}</h2>
        <ul className="plain">
          {courses.map((c) => (
            <Item
              key={courseKey(c)}
              kind="course"
              itemKey={courseKey(c)}
              title={c.title}
              provider={c.provider}
              meta={[c.provider, c.level, c.skill].filter(Boolean).join(' · ')}
              skill={c.skill}
            />
          ))}
        </ul>
      </section>
      <section className="stack">
        <h2>{t('certs')}</h2>
        <ul className="plain">
          {certifications.map((c) => (
            <Item
              key={certKey(c)}
              kind="certification"
              itemKey={certKey(c)}
              title={c.name}
              provider={c.issuer}
              meta={c.issuer}
              note={c.why}
              skill=""
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
