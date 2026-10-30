'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type AvatarKind = 'girl' | 'boy';

// Each character is a 12 x 15 grid. One letter = one square. A dot is empty.
const PALETTE: Record<string, string> = {
  k: '#1b1b2f', // abaya and tarha
  t: '#33334f', // fold in the abaya
  s: '#e6b48c', // skin
  e: '#14213d', // eyes
  m: '#b5654a', // mouth
  w: '#ffffff', // thobe and white squares of the shemagh
  g: '#d3d9e8', // fold in the thobe
  r: '#f2542d', // red squares of the shemagh
  b: '#14213d', // igal and buttons
};

const GRID: Record<AvatarKind, string[]> = {
  girl: [
    '....kkkk....',
    '...kkkkkk...',
    '..kkkttkkk..',
    '.kksssssskk.',
    '.kssessessk.',
    '.kssssssssk.',
    '.ksssmmsssk.',
    '..kksssskk..',
    '..kkksskkk..',
    '.kkkkkkkkkk.',
    'kkkkkttkkkkk',
    'kkkkkkkkkkkk',
    'kkkkkttkkkkk',
    'kkkkkkkkkkkk',
    'kkkkkkkkkkkk',
  ],
  boy: [
    '...rwrwrw...',
    '..rwrwrwrw..',
    '..bbbbbbbb..',
    '.rwsssssswr.',
    '.rwsesseswr.',
    '.rwsssssswr.',
    '.rwssmmsswr.',
    '..rwsssswr..',
    '..rwrwrwrw..',
    '.wwwwwwwwww.',
    'wwwwwbbwwwww',
    'wwwwgwwgwwww',
    'wwwwwbbwwwww',
    'wwwwgwwgwwww',
    'wwwwwwwwwwww',
  ],
};

export const PLATE: Record<AvatarKind, string> = { girl: '#fbd5c8', boy: '#cfd8f3' };

/** Joins neighbouring squares of the same colour so the SVG stays small. */
function runs(kind: AvatarKind) {
  const out: { x: number; y: number; w: number; fill: string }[] = [];
  GRID[kind].forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let w = 1;
      while (x + w < row.length && row[x + w] === c) w++;
      if (c !== '.') out.push({ x, y, w, fill: PALETTE[c] });
      x += w;
    }
  });
  return out;
}

export function PixelAvatar({
  kind,
  size = 96,
  label,
  bob = false,
}: {
  kind: AvatarKind;
  size?: number;
  label?: string;
  bob?: boolean;
}) {
  const reduce = useReducedMotion();
  const rects = useMemo(() => runs(kind), [kind]);
  return (
    <div
      className="flex shrink-0 items-end justify-center overflow-hidden rounded-2xl pt-2"
      style={{ width: size, height: size, backgroundColor: PLATE[kind] }}
    >
      <motion.svg
        viewBox="0 0 12 15"
        shapeRendering="crispEdges"
        style={{ height: '100%', width: 'auto' }}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        animate={bob && !reduce ? { y: [0, -3, 0] } : undefined}
        transition={bob ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : undefined}
      >
        {rects.map((r) => (
          <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
        ))}
      </motion.svg>
    </div>
  );
}

/** The small round profile button: the first letter of the student's name. */
export function LetterAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const letter = Array.from(name.trim())[0]?.toUpperCase() ?? '?';
  return (
    <span
      aria-hidden="true"
      className="grid place-items-center rounded-full bg-fjord font-bold text-salt shadow-[0_0_0_2px_var(--saffron)]"
      style={{ width: size, height: size, fontSize: size * 0.45, fontFamily: 'var(--display)' }}
    >
      {letter}
    </span>
  );
}
