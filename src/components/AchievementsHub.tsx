'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n, type Key } from '@/lib/i18n';
import type { Achievement } from '@/lib/types';
import { buildPost, linkedinCertUrl, linkedinUrl, type AchievementKind } from '@/lib/linkedin';

const KINDS: { kind: AchievementKind; label: Key; empty: Key }[] = [
  { kind: 'project', label: 'achProjects', empty: 'emptyProjects' },
  { kind: 'course', label: 'achCourses', empty: 'emptyCourses' },
  { kind: 'certification', label: 'achCerts', empty: 'emptyCerts' },
];

export function AchievementsHub({
  achievements,
  role,
  onGoRoadmap,
}: {
  achievements: Achievement[];
  role: string;
  onGoRoadmap: () => void;
}) {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<AchievementKind>('project');
  const items = achievements.filter((a) => a.kind === tab);
  const current = KINDS.find((k) => k.kind === tab)!;
  const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-ca-gregory' : 'en-GB', { dateStyle: 'medium' });

  return (
    <section className="stack">
      <h2>{t('achievements')}</h2>
      <div className="tabs" role="tablist">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            type="button"
            role="tab"
            aria-selected={tab === k.kind}
            className="tab"
            onClick={() => setTab(k.kind)}
          >
            {t(k.label)}
            <span className="ms-2 rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-fjord">
              {achievements.filter((a) => a.kind === k.kind).length}
            </span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-[1.5px] border-dashed border-mist p-8 text-center">
          <p className="text-muted-foreground">{t(current.empty)}</p>
          <button type="button" className="btn btn-outline" onClick={onGoRoadmap}>
            {t('goRoadmap')}
          </button>
        </div>
      ) : (
        <ul className="plain" key={tab}>
          {items.map((a, i) => (
            <motion.li
              key={a.id}
              className="line"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
            >
              <strong>{a.project_title}</strong>
              {a.kind === 'project' && <span>{a.step_title}</span>}
              {a.provider && <span>{a.provider}</span>}
              {a.description && <span>{a.description}</span>}
              <span>{fmt.format(new Date(a.issued_on ?? a.created_at))}</span>
              <div className="flex flex-wrap gap-4">
                {a.project_url && (
                  <a className="link" href={a.project_url} target="_blank" rel="noopener noreferrer">
                    {t('viewProject')}
                  </a>
                )}
                <a
                  className="link"
                  href={linkedinUrl(
                    buildPost({
                      lang,
                      role,
                      stepTitle: a.step_title,
                      projectTitle: a.project_title,
                      description: a.description,
                      url: a.project_url,
                      kind: a.kind,
                      provider: a.provider,
                    }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('shareLinkedIn')}
                </a>
                {a.kind === 'certification' && (
                  <a
                    className="link"
                    href={linkedinCertUrl({ name: a.project_title, issuer: a.provider, issuedOn: a.issued_on, url: a.project_url })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('addToLinkedIn')}
                  </a>
                )}
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
