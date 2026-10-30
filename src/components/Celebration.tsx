'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import type { Achievement } from '@/lib/types';
import { buildPost, linkedinCertUrl, linkedinUrl } from '@/lib/linkedin';

const COLORS = ['#f2542d', '#2b3a67', '#14213d', '#b9c2e6'];
const PIECES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: ((i % 14) - 6.5) * 34 + ((i * 37) % 19) - 9,
  fall: 240 + ((i * 53) % 140),
  rotate: ((i * 71) % 540) - 270,
  color: COLORS[i % COLORS.length],
  delay: (i % 7) * 0.05,
}));

export function Celebration({
  achievement,
  role,
  allDone,
  onClose,
}: {
  achievement: Achievement;
  role: string;
  allDone: boolean;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const [post, setPost] = useState(() =>
    buildPost({
      lang,
      role,
      stepTitle: achievement.step_title,
      projectTitle: achievement.project_title,
      description: achievement.description,
      url: achievement.project_url,
      kind: achievement.kind,
      provider: achievement.provider,
    }),
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(post);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked; the text stays visible in the box */
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-fjord/70 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="congrats-title"
    >
      <motion.div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-salt p-7 shadow-2xl"
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center" aria-hidden="true">
          {PIECES.map((p) => (
            <motion.span
              key={p.id}
              className="absolute top-0 block h-3 w-2 rounded-sm"
              style={{ backgroundColor: p.color }}
              initial={{ x: 0, y: -10, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: p.fall, opacity: 0, rotate: p.rotate }}
              transition={{ duration: 1.8, delay: p.delay, ease: 'easeOut' }}
            />
          ))}
        </div>

        <div className="stack">
          <h2 id="congrats-title" className="text-3xl">
            {t('congratsTitle')}
          </h2>
          <p>{t('congratsBody', { step: achievement.step_title })}</p>
          {allDone && <p className="font-semibold text-teal">{t('congratsAll')}</p>}

          <div className="field">
            <label htmlFor="post-text">{t('shareLinkedIn')}</label>
            <textarea id="post-text" rows={8} value={post} onChange={(e) => setPost(e.target.value)} />
            <span className="hint">{t('shareNote')}</span>
          </div>

          <div className="actions">
            <a
              className="btn btn-primary"
              href={linkedinUrl(post)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={copy}
            >
              {t('shareLinkedIn')}
            </a>
            {achievement.kind === 'certification' && (
              <a
                className="btn btn-outline"
                href={linkedinCertUrl({
                  name: achievement.project_title,
                  issuer: achievement.provider,
                  issuedOn: achievement.issued_on,
                  url: achievement.project_url,
                })}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('addToLinkedIn')}
              </a>
            )}
            <button type="button" className="btn btn-outline" onClick={copy}>
              {copied ? t('copied') : t('copyPost')}
            </button>
            <button type="button" className="btn btn-quiet" onClick={onClose} autoFocus>
              {t('continueRoadmap')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
