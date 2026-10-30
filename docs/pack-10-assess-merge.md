# Pack 10: what to merge into `src/components/Assess.tsx` by hand

All other files in this pack are new or fully replaced. Only `Assess.tsx` needs manual edits. Do them in this order.

## 1. Imports

Delete this line (it is no longer used):

```tsx
import { buildPost, linkedinUrl } from '@/lib/linkedin';
```

Add these after `import { CountUp } from './motion';`:

```tsx
import { LearningSection } from './LearningSection';
import { AchievementsHub } from './AchievementsHub';
import type { CompletionValues } from './CompletionForm';
```

## 2. Tab type and state

After `const MAX_PDF = 4 * 1024 * 1024;` add:

```tsx
type Tab = 'analysis' | 'roadmap' | 'achievements';
const TAB_KEYS: Record<Tab, Key> = { analysis: 'tabAnalysis', roadmap: 'tabRoadmap', achievements: 'tabAchievements' };
```

Before `const [booting, setBooting] = useState(true);` add:

```tsx
const [tab, setTab] = useState<Tab>('analysis');
const [learning, setLearning] = useState<string[]>([]);
```

## 3. Loading (inside the `useEffect` that loads progress)

Change the select to:

```tsx
.select('analysis, completed_steps, target_role, learning')
```

After `setDone((p.data.completed_steps as string[]) ?? []);` add:

```tsx
setLearning((p.data.learning as string[]) ?? []);
```

## 4. Two one-line edits

In `submitProof`, inside the `.upsert({ ... })` object, after `project_url: form.url || null,` add:

```tsx
kind: 'project',
```

In `run()`, after `setDone([]);` add:

```tsx
setLearning([]);
```

## 5. New functions (paste just above `const phaseText = ...`)

```tsx
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
```

## 6. The result screen (`return (...)` after `if (!analysis) { ... }`)

Keep `{header}`. Then:

1. Delete the old `{achievements.length > 0 && ( ... )}` section (the achievements list).
2. Delete the old `<div className="columns">` block that contains `t('courses')` and `t('certs')`.
3. Move the "progress" section (`t('progressTitle')`) up so it sits right after the skills section.
4. Arrange everything like this:

```tsx
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
            <span className="ms-2 rounded-full bg-saffron/30 px-2 py-0.5 text-xs font-semibold text-fjord">
              {achievements.length}
            </span>
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
          {/* result-hero section */}
          {/* strengths + gaps (div.columns) */}
          {/* skills section */}
          {/* progress section (chart + buttons) */}
        </>
      )}

      {tab === 'roadmap' && (
        <>
          {/* roadmap section (the whole trail) */}
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
    </motion.div>

    {/* keep: error message, <Celebration .../>, and the "new analysis" actions below, outside the motion.div */}
  </div>
);
```

## 7. Optional

Remove `placeholder={step.projectIdea}` from `<ProofForm ... />` (the grey hint inside the project-name field).
