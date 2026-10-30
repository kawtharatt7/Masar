'use client';

import { useId, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import type { ScorePoint } from '@/lib/types';

const W = 640;
const H = 210;
const PL = 36;
const PR = 24;
const PT = 30;
const PB = 34;

export function ProgressChart({ points }: { points: ScorePoint[] }) {
  const { lang, t } = useI18n();
  const uid = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  const n = points.length;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const x = (i: number) => (n === 1 ? PL + innerW / 2 : PL + (i * innerW) / (n - 1));
  const y = (score: number) => PT + innerH - (score / 100) * innerH;
  const base = y(0);
  const dur = (s: number) => (reduce ? 0 : s);
  const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'short' });
  const dateOf = (p: ScorePoint) => fmt.format(new Date(p.created_at));

  // Smooth S-curves between points: flat at each point, so the line never overshoots 0 or 100.
  const line = points
    .map((p, i) => {
      if (i === 0) return `M${x(0).toFixed(1)} ${y(p.score).toFixed(1)}`;
      const mx = ((x(i - 1) + x(i)) / 2).toFixed(1);
      return `C${mx} ${y(points[i - 1].score).toFixed(1)} ${mx} ${y(p.score).toFixed(1)} ${x(i).toFixed(1)} ${y(p.score).toFixed(1)}`;
    })
    .join(' ');
  const area = `${line} L${x(n - 1).toFixed(1)} ${base} L${x(0).toFixed(1)} ${base} Z`;
  const labelStep = Math.ceil(n / 6);

  const a = active !== null ? points[active] : null;
  const tipX = a ? Math.min(Math.max(x(active as number) - 46, 4), W - 96) : 0;
  const tipY = a ? (y(a.score) - 56 < 2 ? y(a.score) + 16 : y(a.score) - 56) : 0;

  return (
    <div dir="ltr" className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[420px]" role="group" aria-label={t('progressTitle')}>
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2b3a67" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#2b3a67" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={PL} x2={W - PR} y1={y(g)} y2={y(g)} stroke="#e8e2d4" strokeDasharray="4 5" />
            <text x={PL - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="#4a5168">
              {g}
            </text>
          </g>
        ))}

        {n > 1 && (
          <>
            <motion.path
              d={area}
              fill={`url(#${uid}-fill)`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: dur(0.9), delay: dur(0.9) }}
            />
            <motion.path
              d={line}
              fill="none"
              stroke="#2b3a67"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: dur(1.4), ease: 'easeInOut' }}
            />
          </>
        )}

        {active !== null && (
          <line x1={x(active)} x2={x(active)} y1={PT - 6} y2={base} stroke="#2b3a67" strokeOpacity="0.35" strokeDasharray="3 4" />
        )}

        {points.map((p, i) => {
          const last = i === n - 1;
          const cx = x(i);
          const cy = y(p.score);
          const showDate = n <= 6 || i === 0 || last || i % labelStep === 0;
          return (
            <g key={`${p.created_at}-${i}`}>
              {last && !reduce && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  fill="#f2542d"
                  initial={{ r: 8, opacity: 0.5 }}
                  animate={{ r: 20, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 1.6 }}
                />
              )}
              <motion.circle
                cx={cx}
                cy={cy}
                fill={last ? '#f2542d' : '#2b3a67'}
                stroke="#faf8f4"
                strokeWidth={2}
                initial={{ r: 0 }}
                animate={{ r: n === 1 ? 10 : active === i ? 8 : last ? 7 : 5 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18, delay: dur(0.3 + (n > 1 ? (i * 1.1) / (n - 1) : 0)) }}
              />
              {(last || n === 1) && active !== i && (
                <text x={cx} y={cy - 14} textAnchor="middle" fontSize="14" fontWeight="700" fill="#14213d">
                  {p.score}%
                </text>
              )}
              {n === 1 && (
                <text x={cx} y={cy - 34} textAnchor="middle" fontSize="12" fill="#4a5168">
                  {t('chartStart')}
                </text>
              )}
              {showDate && (
                <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="#4a5168">
                  {dateOf(p)}
                </text>
              )}
              <circle
                cx={cx}
                cy={cy}
                r={16}
                fill="transparent"
                stroke="transparent"
                strokeWidth={2}
                tabIndex={0}
                role="img"
                aria-label={`${dateOf(p)}: ${p.score}%`}
                className="cursor-pointer outline-none focus-visible:stroke-saffron"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(active === i ? null : i)}
              />
            </g>
          );
        })}

        {a && (
          <motion.g
            style={{ pointerEvents: 'none' }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <rect x={tipX} y={tipY} width={92} height={42} rx={9} fill="#14213d" />
            <text x={tipX + 46} y={tipY + 17} textAnchor="middle" fontSize="11" fill="#c9cedd">
              {dateOf(a)}
            </text>
            <text x={tipX + 46} y={tipY + 34} textAnchor="middle" fontSize="15" fontWeight="700" fill="#ffffff">
              {a.score}%
            </text>
          </motion.g>
        )}
      </svg>
    </div>
  );
}
