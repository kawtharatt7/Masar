'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { authedFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n, type Key } from '@/lib/i18n';
import type { Analysis } from '@/lib/schemas';
import type { Achievement, ProfileRow, ScorePoint } from '@/lib/types';
import { Logo } from './Logo';
import { LangToggle } from './LangToggle';
import { ProgressChart } from './ProgressChart';
import { ProofForm, type ProofValues } from './ProofForm';
import { Celebration } from './Celebration';
import { CountUp } from './motion';
import { LearningSection } from './LearningSection';
import { AchievementsHub } from './AchievementsHub';
import { LetterAvatar, type AvatarKind } from './Avatar';
import { RoadmapTimeline } from './RoadmapTimeline';
import { CardDialog, StudentCard } from './StudentCard';
import type { CompletionValues } from './CompletionForm';

const IMPORTANCE: Record<'high' | 'medium' | 'low', Key> = {
  high: 'importanceHigh',
  medium: 'importanceMedium',
  low: 'importanceLow',
};

const MAX_PDF = 4 * 1024 * 1024;

type Tab = 'analysis' | 'roadmap' | 'achievements' | 'card';
const TAB_KEYS: Record<Tab, Key> = {
  analysis: 'tabAnalysis',
  roadmap: 'tabRoadmap',
  achievements: 'tabAchievements',
  card: 'tabCard',
};

// Sections fade and rise into view as the student scrolls.
const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: 'easeOut' },
} as const;

const errMsg = (err: unknown) =>
  err instanceof Error ? err.message : ((err as { message?: string })?.message ?? String(err));

export default function Assess({
  profile,
  onEditProfile,
  onProfileUpdate,
}: {
  profile: ProfileRow;
  onEditProfile: () => void;
  onProfileUpdate?: (p: ProfileRow) => void;
}) {
  const { t, lang } = useI18n();
  const { user, signOut } = useAuth();
  const role = profile.target_role ?? '';
  const hasProfileData = (profile.skills?.length ?? 0) + (profile.courses?.length ?? 0) > 0;
  const flipX = lang === 'ar' ? -1 : 1;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [history, setHistory] = useState<ScorePoint[]>([]);
  const [openId, setOpenId] = useState<string | null>('s1');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [proofFor, setProofFor] = useState<string | null>(null);
  const [savingProof, setSavingProof] = useState(false);
  const [celebrate, setCelebrate] = useState<{ achievement: Achievement; allDone: boolean } | null>(null);
  const [tab, setTab] = useState<Tab>('analysis');
  const [showCard, setShowCard] = useState(false);
  const [learning, setLearning] = useState<string[]>([]);
  const [booting, setBooting] = useState(true);
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      supabase
        .from('progress')
        .select('analysis, completed_steps, target_role, learning')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('score_history')
        .select('score, created_at')
        .eq('user_id', user.id)
        .eq('target_role', role)
        .order('created_at', { ascending: true }),
      supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_role', role)
        .order('created_at', { ascending: true }),
    ]).then(([p, h, a]) => {
      if (cancelled) return;
      if (p.error) setError(p.error.message);
      else if (p.data && p.data.target_role === role) {
        setAnalysis(p.data.analysis as Analysis);
        setDone((p.data.completed_steps as string[]) ?? []);
        setLearning((p.data.learning as string[]) ?? []);
      }
      if (h.error) setError(h.error.message);
      else setHistory((h.data ?? []) as ScorePoint[]);
      if (a.error) setError(a.error.message);
      else setAchievements((a.data ?? []) as Achievement[]);
      setBooting(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, role]);

  useEffect(() => {
    if (!busy) return;
    setPhase(0);
    const id = setInterval(() => setPhase((p) => Math.min(p + 1, 2)), 5000);
    return () => clearInterval(id);
  }, [busy]);

  function pickFile(f: File | null) {
    setError('');
    if (!f) return setFile(null);
    if (f.type !== 'application/pdf') return setError(t('errPdfOnly'));
    if (f.size > MAX_PDF) return setError(t('errSize'));
    setFile(f);
  }

  /** useCv=false re-checks using only the saved profile (skills and courses). */
  async function run(useCv: boolean) {
    const sendFile = useCv && mode === 'file' ? file : null;
    const sendText = useCv && mode === 'text' && text.trim().length >= 40 ? text.trim() : '';
    if (!sendFile && !sendText && !hasProfileData) return setError(t('errNoInput'));

    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('lang', lang);
      if (sendFile) fd.set('file', sendFile);
      if (sendText) fd.set('text', sendText);
      const data = await authedFetch<{ analysis: Analysis }>('/api/analyze', { method: 'POST', body: fd });
      setAnalysis(data.analysis);
      setDone([]);
      setLearning([]);
      setOpenId('s1');
      setHistory((h) => [...h, { score: data.analysis.matchScore, created_at: new Date().toISOString() }]);
      setFile(null);
      setText('');
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  /** A step is completed by documenting the suggested project. */
  async function submitProof(stepId: string, stepTitle: string, topics: string[], form: ProofValues) {
    if (!user || !analysis) return;
    setSavingProof(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const { data: saved, error: achError } = await supabase
        .from('achievements')
        .upsert(
          {
            user_id: user.id,
            target_role: role,
            step_id: stepId,
            step_title: stepTitle,
            project_title: form.title,
            description: form.description,
            project_url: form.url || null,
            kind: 'project',
          },
          { onConflict: 'user_id,target_role,step_id' },
        )
        .select()
        .single();
      if (achError) throw achError;

      const nextDone = done.includes(stepId) ? done : [...done, stepId];
      const { error: progError } = await supabase
        .from('progress')
        .update({ completed_steps: nextDone, updated_at: now })
        .eq('user_id', user.id);
      if (progError) throw progError;

      // What the student just practised becomes part of their skills.
      const merged = [...(profile.skills ?? [])];
      for (const tp of topics) if (!merged.some((m) => m.toLowerCase() === tp.toLowerCase())) merged.push(tp);
      const { data: prof } = await supabase
        .from('profiles')
        .update({ skills: merged.slice(0, 80), updated_at: now })
        .eq('id', user.id)
        .select()
        .single();
      if (prof) onProfileUpdate?.(prof as ProfileRow);

      const achievement = saved as Achievement;
      const remaining = analysis.roadmap.map((s, i) => s.id ?? `s${i + 1}`).filter((id) => !nextDone.includes(id));
      setDone(nextDone);
      setAchievements((list) => [...list.filter((a) => a.step_id !== stepId), achievement]);
      setProofFor(null);
      setOpenId(remaining[0] ?? null);
      setCelebrate({ achievement, allDone: remaining.length === 0 });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSavingProof(false);
    }
  }

  async function toggleLearning(key: string) {
    if (!user) return;
    const prev = learning;
    const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
    setLearning(next);
    const { error } = await supabase
      .from('progress')
      .update({ learning: next, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) {
      setLearning(prev);
      setError(error.message);
    }
  }

  /** Marks a course as completed or a certification as earned. Returns true when it was saved. */
  async function submitCompletion(
    kind: 'course' | 'certification',
    key: string,
    title: string,
    provider: string,
    skill: string,
    v: CompletionValues,
  ): Promise<boolean> {
    if (!user) return false;
    setError('');
    try {
      const now = new Date().toISOString();
      const { data: saved, error: achError } = await supabase
        .from('achievements')
        .upsert(
          {
            user_id: user.id,
            target_role: role,
            step_id: key,
            step_title: title,
            project_title: title,
            description: v.description,
            project_url: v.url || null,
            kind,
            provider: provider || null,
            issued_on: kind === 'certification' ? v.issuedOn : null,
          },
          { onConflict: 'user_id,target_role,step_id' },
        )
        .select()
        .single();
      if (achError) throw achError;

      const nextLearning = learning.filter((k) => k !== key);
      await supabase.from('progress').update({ learning: nextLearning, updated_at: now }).eq('user_id', user.id);

      if (kind === 'course') {
        const add = skill || title;
        const merged = [...(profile.skills ?? [])];
        if (!merged.some((m) => m.toLowerCase() === add.toLowerCase())) merged.push(add);
        const { data: prof } = await supabase
          .from('profiles')
          .update({ skills: merged.slice(0, 80), updated_at: now })
          .eq('id', user.id)
          .select()
          .single();
        if (prof) onProfileUpdate?.(prof as ProfileRow);
      }

      setLearning(nextLearning);
      setAchievements((list) => [...list.filter((a) => a.step_id !== key), saved as Achievement]);
      setCelebrate({ achievement: saved as Achievement, allDone: false });
      return true;
    } catch (err) {
      setError(errMsg(err));
      return false;
    }
  }

  const phaseText = [t('analyzing1'), t('analyzing2', { role }), t('analyzing3')][phase];
  const working = busy && (
    <p className="working" role="status">
      <span className="pulse" aria-hidden="true" />
      {phaseText}
    </p>
  );

  const cardProps = {
    profile,
    achievements,
    score: history.length > 0 ? history[history.length - 1].score : (analysis?.matchScore ?? null),
    stepsDone: analysis ? analysis.roadmap.filter((s, i) => done.includes(s.id ?? `s${i + 1}`)).length : 0,
    stepsTotal: analysis?.roadmap.length ?? 0,
    onProfileUpdate,
  };

  const header = (
    <>
      <header className="topbar">
        <Logo />
        <div className="topbar-actions">
          <LangToggle />
          <button className="btn btn-quiet" type="button" onClick={onEditProfile}>
            {t('editProfile')}
          </button>
          <button className="btn btn-quiet" type="button" onClick={signOut}>
            {t('signOut')}
          </button>
          <button
            type="button"
            className="ms-1 rounded-full transition-transform hover:scale-105 active:scale-95"
            onClick={() => setShowCard(true)}
            aria-label={t('openCard')}
            title={t('openCard')}
          >
            <LetterAvatar name={profile.nickname || profile.full_name || ''} />
          </button>
        </div>
      </header>
      {showCard && <CardDialog {...cardProps} onClose={() => setShowCard(false)} />}
    </>
  );

  if (booting) {
    return (
      <div className="shell">
        {header}
        <p className="lede">{t('loading')}</p>
      </div>
    );
  }

  if (!analysis) {
    const canSubmit = (mode === 'file' ? !!file : text.trim().length >= 40) || hasProfileData;
    const usingCv = mode === 'file' ? !!file : text.trim().length >= 40;
    return (
      <div className="shell narrow">
        {header}
        <div className="stack stack-lg">
          <div className="stack">
            <h1>{t('assessTitle', { role })}</h1>
            <p className="lede">{t('assessSub')}</p>
            {hasProfileData && <p className="hint">{t('cvOptional')}</p>}
          </div>

          <div className="tabs" role="tablist">
            {(['file', 'text'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                className="tab"
                onClick={() => {
                  setMode(m);
                  setError('');
                }}
              >
                {m === 'file' ? t('uploadTab') : t('pasteTab')}
              </button>
            ))}
          </div>

          {mode === 'file' ? (
            <div className="drop">
              <input ref={fileInput} type="file" accept="application/pdf" hidden onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
              <button type="button" className="btn btn-outline" onClick={() => fileInput.current?.click()}>
                {file ? t('changePdf') : t('choosePdf')}
              </button>
              {file && (
                <p className="file-name" dir="ltr">
                  {file.name}
                </p>
              )}
            </div>
          ) : (
            <div className="field">
              <textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('pastePh')} aria-label={t('pasteTab')} />
            </div>
          )}

          {error && (
            <p className="msg msg-error" role="alert">
              {error}
            </p>
          )}

          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => run(true)} disabled={busy || !canSubmit}>
              {usingCv || !hasProfileData ? t('analyze') : t('analyzeProfile')}
            </button>
            {working}
          </div>
        </div>
      </div>
    );
  }

  const score = analysis.matchScore;
  const doneCount = analysis.roadmap.filter((s) => s.id && done.includes(s.id)).length;
  const recent = history.slice(-12);
  const delta = history.length > 1 ? history[history.length - 1].score - history[0].score : 0;
  const deltaText = `${delta > 0 ? '+' : ''}${delta}`;
  const currentId = analysis.roadmap.map((s, i) => s.id ?? `s${i + 1}`).find((id) => !done.includes(id));

  return (
    <div className="shell">
      {header}

      <div className="tabs" role="tablist">
        {(Object.keys(TAB_KEYS) as Tab[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className="tab"
            onClick={() => {
              setTab(k);
              window.scrollTo({ top: 0 });
            }}
          >
            {t(TAB_KEYS[k])}
            {k === 'achievements' && achievements.length > 0 && (
              <span className="ms-2 rounded-full bg-saffron/30 px-2 py-0.5 text-xs font-semibold text-fjord">{achievements.length}</span>
            )}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        className="flex flex-col gap-[52px]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {tab === 'analysis' && (
          <>
      <motion.section {...reveal} className="result-hero">
        <div className="stack">
          <h1>{role}</h1>
          <p className="lede">{analysis.summary}</p>
          {analysis.marketInsight && (
            <div className="border-s-4 border-saffron bg-white py-3 pe-4 ps-4">
              <p className="mb-1 text-sm font-semibold text-fjord">{t('marketInsight')}</p>
              <p className="text-ink">{analysis.marketInsight}</p>
            </div>
          )}
        </div>
        <div className="route" style={{ '--score': `${score}%` } as CSSProperties}>
          <div className="route-readout">
            <span className="route-number">
              <CountUp value={score} suffix="%" />
            </span>
            <span>{t('matchFor', { role })}</span>
          </div>
          <div className="route-track" role="img" aria-label={`${score}%`}>
            <span className="route-fill" />
            <span className="route-pin" />
          </div>
          <div className="route-ends">
            <span>{t('you')}</span>
            <span>{role}</span>
          </div>
        </div>
      </motion.section>

      <div className="columns">
        <motion.section {...reveal} className="stack">
          <h2>{t('strengths')}</h2>
          <ul className="plain">
            {analysis.strengths.map((s) => (
              <li key={s.skill} className="line">
                <strong>{s.skill}</strong>
                {s.evidence && <span>{s.evidence}</span>}
              </li>
            ))}
          </ul>
        </motion.section>
        <motion.section {...reveal} className="stack">
          <h2>{t('gaps')}</h2>
          <ul className="plain">
            {analysis.gaps.map((g) => (
              <li key={g.skill} className={`line gap gap-${g.importance}`}>
                <span className="gap-head">
                  <strong>{g.skill}</strong>
                  <span className="tag">{t(IMPORTANCE[g.importance])}</span>
                </span>
                {g.reason && <span>{g.reason}</span>}
              </li>
            ))}
          </ul>
        </motion.section>
      </div>

      <motion.section {...reveal} className="stack">
        <div className="section-head">
          <h2>{t('skillMap')}</h2>
          <p className="legend">
            <span className="key key-have" />
            {t('legendHave')}
            <span className="key key-need" />
            {t('legendNeed')}
          </p>
        </div>
        <ul className="plain skills">
          {analysis.skills.map((s) => (
            <li key={s.name} className="skill">
              <span className="skill-name">{s.name}</span>
              <span className="bar" role="img" aria-label={`${s.have}% / ${s.need}%`}>
                <motion.span
                  className="bar-have"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.have}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
                <span className="bar-need" style={{ insetInlineStart: `${s.need}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section {...reveal} className="stack">
        <div className="section-head">
          <h2>{t('progressTitle')}</h2>
          {history.length > 1 && <p className="legend">{t('scoreChange', { d: deltaText })}</p>}
        </div>
        {recent.length > 0 && <ProgressChart points={recent} />}
        <p className="hint">{history.length > 1 ? t('reassessHint') : t('progressOne')}</p>
        <div className="actions">
          <button className="btn btn-outline" type="button" onClick={onEditProfile}>
            {t('updateSkills')}
          </button>
          <button className="btn btn-primary" type="button" onClick={() => run(false)} disabled={busy || !hasProfileData}>
            {t('reassess')}
          </button>
          {working}
        </div>
      </motion.section>

          </>
        )}

        {tab === 'roadmap' && (
          <>
      <RoadmapTimeline
        steps={analysis.roadmap.map((s, i) => ({
          id: s.id ?? `s${i + 1}`,
          title: s.title,
          duration: s.duration,
          description: s.description,
        }))}
        done={done}
        currentId={currentId}
        role={role}
        avatar={(profile.avatar as AvatarKind | null) ?? null}
        onPick={(id) => {
          setOpenId(id);
          requestAnimationFrame(() =>
            document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          );
        }}
      />

      <motion.section {...reveal} className="stack">
        <div className="section-head">
          <h2>{t('stepDetails')}</h2>
          <p className="legend">{t('stepsDone', { n: doneCount, m: analysis.roadmap.length })}</p>
        </div>
        <div className="route-track" aria-hidden="true" style={{ marginBlock: 0 }}>
          <motion.span
            className="absolute inset-y-0 start-0 rounded-full bg-teal"
            initial={{ width: 0 }}
            animate={{ width: `${(doneCount / Math.max(analysis.roadmap.length, 1)) * 100}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
        <ol className="trail">
          {analysis.roadmap.map((step, i) => {
            const id = step.id ?? `s${i + 1}`;
            const checked = done.includes(id);
            const open = openId === id;
            const topics = step.topics ?? [];
            return (
              <motion.li
                key={id}
                id={`step-${id}`}
                className={`scroll-mt-6 ${checked ? 'stop stop-done' : 'stop'}${id === currentId ? ' stop-current' : ''}`}
                initial={{ opacity: 0, x: -28 * flipX }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: Math.min(i, 4) * 0.06, ease: 'easeOut' }}
              >
                {i < analysis.roadmap.length - 1 && (
                  <motion.span
                    aria-hidden="true"
                    className="stop-line"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeInOut' }}
                  />
                )}
                <button type="button" className="stop-mark" role="checkbox" aria-checked={checked} aria-label={step.title} aria-disabled={checked} title={checked ? undefined : t('stepLocked')} onClick={() => { if (!checked) { setOpenId(id); setProofFor(id); } }}>
                  {checked ? (
                    <motion.svg
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  ) : (
                    i + 1
                  )}
                </button>
                <div className="stack stack-sm">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={open}
                      className="flex w-full items-center gap-3 text-start"
                      onClick={() => setOpenId(open ? null : id)}
                    >
                      <span>{step.title}</span>
                      {step.duration && <span className="tag">{step.duration}</span>}
                      <svg
                        className={`ms-auto shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="stack stack-sm pb-2">
                          {step.description && <p>{step.description}</p>}
                          {topics.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-sm font-semibold text-fjord">{t('topics')}</p>
                              <ul className="flex flex-wrap gap-2">
                                {topics.map((tp) => (
                                  <li key={tp} className="tag">
                                    {tp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {step.actions.length > 0 && (
                            <ul className="actions-list">
                              {step.actions.map((a) => (
                                <li key={a}>{a}</li>
                              ))}
                            </ul>
                          )}
                          {step.projectIdea && (
                            <div className="rounded-e-lg border-s-4 border-teal bg-white py-3 pe-3 ps-4">
                              <p className="mb-0.5 text-sm font-semibold text-fjord">{t('projectIdea')}</p>
                              <p>{step.projectIdea}</p>
                            </div>
                          )}
                          {!checked &&
                            (proofFor === id ? (
                              <ProofForm
                                busy={savingProof}
                                onCancel={() => setProofFor(null)}
                                onSubmit={(v) => submitProof(id, step.title, topics, v)}
                              />
                            ) : (
                              <div>
                                <button className="btn btn-outline" type="button" onClick={() => setProofFor(id)}>
                                  {t('documentProject')}
                                </button>
                              </div>
                            ))}
                          {checked && achievements.find((a) => a.step_id === id) && (
                            <p className="text-sm font-semibold text-teal">
                              ✓ {achievements.find((a) => a.step_id === id)?.project_title}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </motion.section>


            <LearningSection
              courses={analysis.courses}
              certifications={analysis.certifications}
              achievements={achievements}
              learning={learning}
              onToggleLearning={toggleLearning}
              onComplete={submitCompletion}
            />
          </>
        )}

        {tab === 'achievements' && (
          <AchievementsHub achievements={achievements} role={role} onGoRoadmap={() => setTab('roadmap')} />
        )}

        {tab === 'card' && <StudentCard {...cardProps} />}
      </motion.div>

      {error && (
        <p className="msg msg-error" role="alert">
          {error}
        </p>
      )}

      {celebrate && (
        <Celebration
          achievement={celebrate.achievement}
          role={role}
          allDone={celebrate.allDone}
          onClose={() => setCelebrate(null)}
        />
      )}

      <div className="actions">
        <button className="btn btn-outline" type="button" onClick={() => setAnalysis(null)}>
          {t('newAnalysis')}
        </button>
      </div>
    </div>
  );
}
