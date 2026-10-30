'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n, type Key } from '@/lib/i18n';
import { Logo } from './Logo';
import { LangToggle } from './LangToggle';
import { HeroCard } from './HeroCard';
import { PixelAvatar } from './Avatar';

// Put your video at public/intro.mp4, or set NEXT_PUBLIC_INTRO_VIDEO_URL to a direct video link.
const VIDEO_URL = process.env.NEXT_PUBLIC_INTRO_VIDEO_URL || '/intro.mp4';

const AUDIENCE: Key[] = ['aud1', 'aud2', 'aud3'];
const FEATURES: { title: Key; body: Key }[] = [
  { title: 'feat1Title', body: 'feat1Body' },
  { title: 'feat2Title', body: 'feat2Body' },
  { title: 'feat3Title', body: 'feat3Body' },
  { title: 'feat4Title', body: 'feat4Body' },
];

const reveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: 'easeOut' },
} as const;

// The two pixel characters walk along the path toward the goal. Decorative, so hidden from screen readers.
function PathWalkers() {
  const reduce = useReducedMotion();
  const walkers = [
    { kind: 'girl' as const, delay: 0, still: '34%' },
    { kind: 'boy' as const, delay: 1.2, still: '46%' },
  ];
  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 sm:px-10" aria-hidden="true">
      <div className="relative h-20 rtl:-scale-x-100">
        <div className="absolute inset-x-0 bottom-3 border-t-[3px] border-dashed border-saffron" />
        <span className="absolute bottom-[7px] left-0 size-3 rounded-full bg-saffron" />
        {[25, 50, 75].map((p) => (
          <span key={p} className="absolute bottom-[7px] size-3 -translate-x-1/2 rounded-full bg-fjord" style={{ left: `${p}%` }} />
        ))}
        <span className="absolute bottom-0 right-0 size-6 rounded-full border-4 border-salt bg-saffron shadow-[0_0_0_2px_var(--fjord)]" />
        {walkers.map((w) => (
          <motion.div
            key={w.kind}
            className="absolute bottom-[16px] -translate-x-1/2"
            style={{ left: reduce ? w.still : '4%', opacity: reduce ? 1 : 0 }}
            animate={reduce ? undefined : { left: ['4%', '94%'], opacity: [0, 1, 1, 0] }}
            transition={{
              left: { duration: 12, delay: w.delay, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 12, delay: w.delay, repeat: Infinity, times: [0, 0.05, 0.93, 1] },
            }}
          >
            <PixelAvatar kind={w.kind} size={44} bob />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Landing({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="min-h-screen bg-salt text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 text-fjord sm:px-10">
        <Logo />
        <div className="flex items-center gap-1">
          <LangToggle />
          <button type="button" className="btn btn-outline" onClick={onStart}>
            {t('signIn')}
          </button>
        </div>
      </header>

      <main>
        <motion.section {...reveal} className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-6 pt-2 sm:px-10 lg:grid-cols-2 lg:pt-4">
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 self-start rounded-full border-[1.5px] border-fjord bg-white px-3.5 py-1.5 text-sm font-medium text-fjord">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 15C8 15 2.5 9.5 2.5 6a5.5 5.5 0 0 1 11 0C13.5 9.5 8 15 8 15Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="8" cy="6" r="1.8" fill="var(--saffron)" />
              </svg>
              {t('landingBadge')}
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              {t('landingTitle')}
              <span className="bg-[linear-gradient(transparent_62%,var(--saffron)_62%,var(--saffron)_92%,transparent_92%)] px-1">
                {t('landingTitleHi')}
              </span>
            </h1>
            <p className="max-w-[52ch] text-base text-muted-foreground">{t('landingSub')}</p>
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" className="btn btn-primary px-6 py-3 text-base" onClick={onStart}>
                {t('startFree')}
              </button>
              <a href="#intro" className="link">
                {t('watchIntro')}
              </a>
            </div>
          </div>

          <HeroCard />
        </motion.section>
                <PathWalkers />

        <motion.section {...reveal} id="intro" className="bg-fjord py-20 text-salt">
          <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 sm:px-10">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl text-salt">{t('videoTitle')}</h2>
              <p className="text-[#c9cedd]">{t('videoSub')}</p>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/30 ring-1 ring-white/15">
              {videoFailed ? (
                <p className="absolute inset-0 grid place-items-center px-6 text-center text-[#c9cedd]">
                  {t('videoMissing')}
                </p>
              ) : (
                <video
                  className="size-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                  onError={() => setVideoFailed(true)}
                >
                  <source src={VIDEO_URL} type="video/mp4" onError={() => setVideoFailed(true)} />
                </video>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section {...reveal} className="mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col gap-5">
            <h2 className="text-2xl">{t('audienceTitle')}</h2>
            <ul className="flex flex-col gap-3">
              {AUDIENCE.map((k) => (
                <li key={k} className="border-s-4 border-saffron ps-4 text-lg">
                  {t(k)}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-5">
            <h2 className="text-2xl">{t('featuresTitle')}</h2>
            <ul>
              {FEATURES.map((f) => (
                <li key={f.title} className="flex flex-col gap-1 border-b-[1.5px] border-mist py-5 first:pt-0">
                  <h3>{t(f.title)}</h3>
                  <p className="text-muted-foreground">{t(f.body)}</p>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        <motion.section {...reveal} className="mx-auto max-w-6xl px-5 pb-24 sm:px-10">
          <div className="flex flex-col items-start gap-6 rounded-2xl bg-teal-soft p-8 sm:p-12">
            <h2 className="max-w-[22ch] text-3xl">{t('ctaTitle')}</h2>
            <button type="button" className="btn btn-primary px-7 py-3.5 text-lg" onClick={onStart}>
              {t('startFree')}
            </button>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
