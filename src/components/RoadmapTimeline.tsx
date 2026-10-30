'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, type MotionValue } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { PixelAvatar, type AvatarKind } from './Avatar';

export type TimelineStep = { id: string; title: string; duration?: string; description?: string };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function useViewport() {
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  useLayoutEffect(() => {
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);
  return vp;
}

type MilestoneProps = {
  step: TimelineStep;
  index: number;
  x: number;
  width: number;
  top: boolean;
  state: 'done' | 'current' | 'upcoming';
  avatar: AvatarKind | null;
  progress: MotionValue<number>;
  start: number;
  onPick: () => void;
};

function Milestone({ step, index, x, width, top, state, avatar, progress, start, onPick }: MilestoneProps) {
  const { t } = useI18n();
  const opacity = useMotionValue(1);
  const lift = useMotionValue(0);
  const stem = useMotionValue(1);

  // Each milestone draws its stem and reveals its copy as the track slides it into view.
  const apply = useCallback(
    (p: number) => {
      if (start <= 0) {
        opacity.set(1);
        lift.set(0);
        stem.set(1);
        return;
      }
      stem.set(clamp01((p - (start - 0.05)) / 0.08));
      const r = clamp01((p - start) / 0.07);
      opacity.set(r);
      lift.set((1 - r) * (top ? 28 : -28));
    },
    [start, top, opacity, lift, stem],
  );
  useMotionValueEvent(progress, 'change', apply);
  useLayoutEffect(() => apply(progress.get()), [apply, progress]);

  const done = state === 'done';
  const current = state === 'current';

  return (
    <>
      {/* dot on the line */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2"
        style={{ insetInlineStart: x }}
      >
        <motion.span
          style={{ opacity: stem }}
          className={`grid size-[22px] place-items-center rounded-full border-2 ${
            done
              ? 'border-fjord bg-fjord text-salt'
              : current
                ? 'border-saffron bg-saffron motion-safe:animate-[ring_1.8s_ease-out_infinite]'
                : 'border-saffron bg-salt'
          }`}
        >
          {done && (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </motion.span>
      </div>

      {/* the student's character stands on the current step, on the side the text is not */}
      {current && avatar && (
        <div
          className={`absolute z-10 -translate-x-1/2 rtl:translate-x-1/2 ${top ? 'top-1/2 mt-5' : 'bottom-1/2 mb-5'}`}
          style={{ insetInlineStart: x }}
        >
          <PixelAvatar kind={avatar} size={56} label={t('you')} bob />
        </div>
      )}

      <div className={`absolute h-1/2 ${top ? 'top-0' : 'top-1/2'}`} style={{ insetInlineStart: x, width }}>
        <motion.span
          aria-hidden="true"
          className={`absolute inset-y-0 start-0 w-0.5 rounded-full bg-saffron ${top ? 'origin-bottom' : 'origin-top'}`}
          style={{ scaleY: stem, opacity: stem }}
        />
        <motion.div className={`absolute inset-x-0 ${top ? 'top-0' : 'bottom-0'}`} style={{ opacity, y: lift }}>
          <button
            type="button"
            onClick={onPick}
            className="group flex w-full flex-col items-start gap-2 rounded-xl py-1 ps-5 pe-2 text-start"
          >
            <span className="flex flex-wrap items-center gap-2">
              <span
                className={`font-[family-name:var(--display)] text-[44px] font-bold leading-none tracking-tight ${
                  done ? 'text-muted-foreground' : 'text-fjord'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              {done ? (
                <span className="rounded-full bg-fjord px-2.5 py-0.5 text-xs font-semibold text-salt">✓ {t('doneTag')}</span>
              ) : (
                step.duration && <span className="tag">{step.duration}</span>
              )}
            </span>
            <span
              className={`font-[family-name:var(--display)] text-[1.2rem] font-bold leading-snug ${
                done ? 'text-muted-foreground' : 'text-fjord'
              }`}
            >
              {step.title}
            </span>
            {step.description && (
              <span className="line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">{step.description}</span>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-fjord underline decoration-saffron decoration-2 underline-offset-4 group-hover:decoration-fjord">
              {t('openStep')}
              <svg className="rtl:-scale-x-100" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </motion.div>
      </div>
    </>
  );
}

/**
 * Horizontal roadmap: the section pins while the page scrolls, the track slides sideways,
 * and each milestone draws its stem and reveals its copy as it arrives. Milestones alternate
 * above and below the line. Reduced motion or a short roadmap falls back to a plain track.
 */
export function RoadmapTimeline({
  steps,
  done,
  currentId,
  role,
  avatar,
  onPick,
}: {
  steps: TimelineStep[];
  done: string[];
  currentId: string | undefined;
  role: string;
  avatar: AvatarKind | null;
  onPick: (id: string) => void;
}) {
  const { t, lang } = useI18n();
  const reduce = useReducedMotion();
  const vp = useViewport();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const x = useMotionValue(0);

  const small = vp.w < 640;
  const n = steps.length;
  const itemW = small ? 250 : 340; // width of one milestone's text
  const pitch = small ? 190 : 250; // distance along the line between two milestones
  const introW = small ? Math.round(Math.min(vp.w * 0.74, 300)) : 380;
  const pad = small ? 22 : 64;
  const trackH = Math.min(small ? 600 : 580, Math.max(500, vp.h - 120));

  const lineStart = pad + introW - 26;
  const x0 = pad + introW;
  const goalX = x0 + Math.max(0, n - 1) * pitch + itemW + 36;
  const trackW = goalX + (small ? 230 : 320) + pad;

  const dist = Math.max(0, trackW - vp.w);
  const pinned = !reduce && dist > 0;
  const sign = lang === 'ar' ? 1 : -1; // the track slides toward its end: left in English, right in Arabic

  useMotionValueEvent(scrollYProgress, 'change', (p) => x.set(pinned ? p * dist * sign : 0));
  useEffect(() => {
    x.set(pinned ? scrollYProgress.get() * dist * sign : 0);
  }, [pinned, dist, sign, x, scrollYProgress]);

  const doneCount = steps.filter((s) => done.includes(s.id)).length;
  const pct = n ? Math.round((doneCount / n) * 100) : 0;

  const track = (
    <motion.div
      className="relative flex-none"
      style={{ width: trackW, height: trackH, x: pinned ? x : 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* base line, and the part that fills in as you scroll */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-mist"
        style={{ insetInlineStart: lineStart, width: goalX - lineStart }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute top-1/2 h-0.5 origin-left -translate-y-1/2 rounded-full bg-saffron rtl:origin-right"
        style={{ insetInlineStart: lineStart, width: goalX - lineStart, scaleX: pinned ? scrollYProgress : 1 }}
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-saffron rtl:translate-x-1/2"
        style={{ insetInlineStart: lineStart }}
      />

      {/* intro */}
      <div className="absolute top-1/2 flex -translate-y-1/2 flex-col gap-4 pe-6" style={{ insetInlineStart: pad, width: introW - 26 }}>
        <span className="text-sm font-semibold text-muted-foreground">{role}</span>
        <h2 className="text-[2.4rem] leading-[1.05]">{t('roadmap')}</h2>
        <p className="text-muted-foreground">{t('stepsDone', { n: doneCount, m: n })}</p>
        <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-mist" aria-hidden="true">
          <motion.div
            className="h-full rounded-full bg-fjord"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
        {pinned && (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-fjord">
            {t('scrollHint')}
          </p>
        )}
      </div>

      {steps.map((step, i) => {
        const stemX = x0 + i * pitch;
        const start = pinned ? Math.min(0.94, (stemX - vp.w * 0.82) / dist) : 0;
        return (
          <Milestone
            key={step.id}
            step={step}
            index={i}
            x={stemX}
            width={itemW}
            top={i % 2 === 0}
            state={done.includes(step.id) ? 'done' : step.id === currentId ? 'current' : 'upcoming'}
            avatar={avatar}
            progress={scrollYProgress}
            start={start}
            onPick={() => onPick(step.id)}
          />
        );
      })}

      {/* goal */}
      <span
        aria-hidden="true"
        className="absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-salt bg-saffron shadow-[0_0_0_2px_var(--fjord)] rtl:translate-x-1/2"
        style={{ insetInlineStart: goalX }}
      />
      <div className="absolute top-1/2 mt-7 flex flex-col gap-1 ps-1" style={{ insetInlineStart: goalX - 14, width: small ? 210 : 280 }}>
        <span className="text-sm font-semibold text-muted-foreground">{t('goal')}</span>
        <span className="font-[family-name:var(--display)] text-2xl font-bold leading-tight text-fjord">{role}</span>
      </div>
    </motion.div>
  );

  return (
    <section
      ref={sectionRef}
      aria-label={t('roadmap')}
      className="relative w-screen max-w-[100vw]"
      style={{ marginInline: 'calc(50% - 50vw)', height: pinned ? dist + vp.h : undefined }}
    >
      {pinned ? (
        <div className="sticky top-0 flex items-center overflow-hidden" style={{ height: vp.h }}>
          {track}
        </div>
      ) : (
        <div className="overflow-x-auto py-6">
          <div className="mx-auto flex" style={{ width: Math.max(trackW, vp.w) }}>
            {track}
          </div>
        </div>
      )}
    </section>
  );
}
