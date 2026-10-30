'use client';

import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { authedFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n, type Key } from '@/lib/i18n';
import { MAJORS } from '@/lib/majors';
import { QUIZ, type QuizKey } from '@/lib/quiz';
import type { ProfileRow, Role } from '@/lib/types';
import { Logo } from './Logo';
import { LangToggle } from './LangToggle';
import { TagInput } from './TagInput';
import { LetterAvatar } from './Avatar';

const DEMAND: Record<Role['demand'], Key> = { high: 'demandHigh', medium: 'demandMedium', low: 'demandLow' };
const STEPS: Key[] = ['stepMajor', 'stepHave', 'stepGoal'];
const CHIP =
  'rounded-full border-[1.5px] border-mist bg-white px-3 py-1 text-sm font-medium text-fjord hover:border-teal aria-pressed:border-fjord aria-pressed:bg-fjord aria-pressed:text-salt';

type Answers = Record<QuizKey, string[]>;
const EMPTY_ANSWERS: Answers = { enjoy: [], environment: [], values: [], style: [] };

function SuggestChips({ items, existing, onAdd }: { items: string[]; existing: string[]; onAdd: (v: string) => void }) {
  const { t } = useI18n();
  const left = items.filter((i) => !existing.some((e) => e.toLowerCase() === i.toLowerCase()));
  if (left.length === 0) return null;
  return (
    <div className="-mt-2 flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{t('tapToAdd')}</span>
      {left.map((i) => (
        <button key={i} type="button" className={CHIP} onClick={() => onAdd(i)}>
          + {i}
        </button>
      ))}
    </div>
  );
}

export default function Profile({
  initial,
  onSaved,
  onCancel,
}: {
  initial: ProfileRow | null;
  onSaved: (p: ProfileRow) => void;
  onCancel?: () => void;
}) {
  const { t, lang } = useI18n();
  const { user, signOut } = useAuth();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [major, setMajor] = useState(initial?.major ?? '');
  const [year, setYear] = useState(initial?.academic_year ?? 1);
  const [courses, setCourses] = useState<string[]>(initial?.courses ?? []);
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  const [role, setRole] = useState(initial?.target_role ?? '');
  const [sugg, setSugg] = useState<{ courses: string[]; skills: string[] } | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggKey, setSuggKey] = useState('');
  const [rolesKey, setRolesKey] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [finding, setFinding] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const flip = lang === 'ar' ? -1 : 1;

  function go(to: number) {
    setError('');
    setDir(to > step ? 1 : -1);
    setStep(to);
  }

  function next() {
    if (step === 0 && !major.trim()) return setError(t('errMajorFirst'));
    go(Math.min(step + 1, STEPS.length - 1));
  }

  async function suggest() {
    if (!major.trim()) return setError(t('errMajorFirst'));
    setError('');
    if (sugg && suggKey === major.trim()) return;
    setSuggesting(true);
    try {
      setSuggKey(major.trim());
      setSugg(
        await authedFetch<{ courses: string[]; skills: string[] }>('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ major: major.trim(), lang }),
        }),
      );
    } catch (err) {
      setSuggKey('');
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSuggesting(false);
    }
  }

  async function findRoles(withAnswers: boolean) {
    if (!major.trim()) return setError(t('errMajorFirst'));
    const key = `${major.trim()}|${year}|${skills.join(',')}`;
    if (!withAnswers && roles.length > 0 && rolesKey === key) return;
    setError('');
    setFinding(true);
    try {
      const payload: Record<string, unknown> = {
        major: major.trim(),
        year,
        interests: skills.join(', '),
        lang,
      };
      if (withAnswers) {
        payload.answers = {
          ...Object.fromEntries(
            QUIZ.map((q) => [q.key, q.options.filter((o) => answers[q.key].includes(o.en)).map((o) => o.en)]),
          ),
          notes: notes.trim(),
        };
      }
      const data = await authedFetch<{ roles: Role[] }>('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setRoles(data.roles);
      setRolesKey(withAnswers ? '' : key);
      if (withAnswers) setQuizOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setFinding(false);
    }
  }

  function toggleAnswer(key: QuizKey, value: string) {
    setAnswers((a) => ({ ...a, [key]: a[key].includes(value) ? a[key].filter((v) => v !== value) : [...a[key], value] }));
  }

  async function save() {
    if (!user) return;
    if (!major.trim() || !role.trim()) return setError(t('errProfileFields'));
    setError('');
    setSaving(true);
    const meta = user.user_metadata as { full_name?: string; name?: string };
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: initial?.full_name ?? meta.full_name ?? meta.name ?? null,
        major: major.trim(),
        academic_year: year,
        courses,
        skills,
        target_role: role.trim(),
        language: lang,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    setSaving(false);
    if (error) return setError(error.message);
    onSaved(data as ProfileRow);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) next();
    else save();
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="shell narrow">
      <header className="topbar">
        <Logo />
        <div className="topbar-actions">
          <LangToggle />
          <button className="btn btn-quiet" type="button" onClick={signOut}>
            {t('signOut')}
          </button>
          {initial?.nickname && (
            <span className="ms-1">
              <LetterAvatar name={initial.nickname} />
            </span>
          )}
        </div>
      </header>

      <form className="stack stack-lg" onSubmit={onSubmit}>
        <div className="stack">
          <h1>{t('profileTitle')}</h1>
          <p className="lede">{t('profileSub')}</p>
          <div className="mt-2 flex gap-2" aria-hidden="true">
            {STEPS.map((k, i) => (
              <motion.span
                key={k}
                className="h-1.5 flex-1 rounded-full"
                animate={{ backgroundColor: i <= step ? '#2b3a67' : '#e8e2d4' }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
          <p className="text-sm font-semibold text-fjord">
            {t('stepOf', { n: step + 1, m: STEPS.length })} · {t(STEPS[step])}
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className="stack stack-lg"
            initial={{ opacity: 0, x: 36 * dir * flip }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -36 * dir * flip }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {step === 0 && (
              <>
                <div className="field">
                  <label htmlFor="major">{t('major')}</label>
                  <input
                    id="major"
                    list="majors"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder={t('majorPh')}
                    autoComplete="off"
                  />
                  <datalist id="majors">
                    {MAJORS.map((m) => (
                      <option key={m.en} value={lang === 'ar' ? m.ar : m.en} />
                    ))}
                  </datalist>
                  <span className="hint">{t('majorHint')}</span>
                </div>

                <div className="field">
                  <span className="label" id="year-label">
                    {t('year')}
                  </span>
                  <div className="seg" role="radiogroup" aria-labelledby="year-label">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" role="radio" aria-checked={year === n} className="seg-item" onClick={() => setYear(n)}>
                        {n === 5 ? '5+' : n}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className="hint">{t('skipHint')}</p>
                <div>
                  <button className="btn btn-outline" type="button" onClick={suggest} disabled={suggesting}>
                    {suggesting ? t('suggesting') : t('suggestForMajor')}
                  </button>
                </div>
                <TagInput id="courses" label={t('coursesDone')} value={courses} onChange={setCourses} placeholder={t('coursesPh')} hint={t('tagHint')} />
                {sugg && <SuggestChips items={sugg.courses} existing={courses} onAdd={(v) => setCourses((c) => [...c, v])} />}
                <TagInput id="skills" label={t('skillsLabel')} value={skills} onChange={setSkills} placeholder={t('skillsPh')} hint={t('tagHint')} />
                {sugg && <SuggestChips items={sugg.skills} existing={skills} onAdd={(v) => setSkills((s) => [...s, v])} />}
              </>
            )}

            {step === 2 && (
              <>
                <div className="field">
                  <label htmlFor="role">{t('targetRole')}</label>
                  <input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder={t('targetRolePh')} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button className="btn btn-outline" type="button" onClick={() => findRoles(false)} disabled={finding}>
                    {finding && !quizOpen ? t('findingRoles') : t('findRoles')}
                  </button>
                  <button className="btn btn-quiet" type="button" aria-expanded={quizOpen} onClick={() => setQuizOpen((o) => !o)}>
                    {t('notSure')}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {quizOpen && (
                    <motion.div
                      key="quiz"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="stack stack-lg rounded-xl border-[1.5px] border-mist bg-white p-5">
                        <div className="stack stack-sm">
                          <h3>{t('quizTitle')}</h3>
                          <p className="hint">{t('quizSub')}</p>
                        </div>
                        {QUIZ.map((q) => (
                          <fieldset key={q.key} className="m-0 flex flex-col gap-2 border-0 p-0">
                            <legend className="mb-1 p-0 font-semibold text-fjord">{lang === 'ar' ? q.ar : q.en}</legend>
                            <div className="flex flex-wrap gap-2">
                              {q.options.map((o) => (
                                <button
                                  key={o.en}
                                  type="button"
                                  className={CHIP}
                                  aria-pressed={answers[q.key].includes(o.en)}
                                  onClick={() => toggleAnswer(q.key, o.en)}
                                >
                                  {lang === 'ar' ? o.ar : o.en}
                                </button>
                              ))}
                            </div>
                          </fieldset>
                        ))}
                        <div className="field">
                          <label htmlFor="notes">{t('quizNotes')}</label>
                          <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                        <div className="actions">
                          <button className="btn btn-primary" type="button" onClick={() => findRoles(true)} disabled={finding}>
                            {finding ? t('findingRoles') : t('findRoles')}
                          </button>
                          <button className="btn btn-quiet" type="button" onClick={() => setQuizOpen(false)}>
                            {t('quizClose')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {roles.length > 0 && (
                  <div className="stack">
                    <h3>{t('rolesHeading')}</h3>
                    <ul className="role-list">
                      {roles.map((r, i) => (
                        <motion.li key={r.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                          <button type="button" className="role-row" aria-pressed={role === r.title} onClick={() => setRole(r.title)}>
                            <span className="role-head">
                              <strong>{r.title}</strong>
                              <span className={`tag tag-${r.demand}`}>{t(DEMAND[r.demand])}</span>
                            </span>
                            <span className="role-why">{r.why}</span>
                            {r.skills.length > 0 && <span className="role-skills">{r.skills.join(lang === 'ar' ? '، ' : ', ')}</span>}
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="msg msg-error" role="alert">
            {error}
          </p>
        )}

        <div className="actions">
          {step > 0 && (
            <button className="btn btn-outline" type="button" onClick={() => go(step - 1)}>
              {t('back')}
            </button>
          )}
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {last ? (saving ? t('saving') : t('continueAnalysis')) : t('next')}
          </button>
          {onCancel && (
            <button className="btn btn-quiet" type="button" onClick={onCancel}>
              {t('cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
