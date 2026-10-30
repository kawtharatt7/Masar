'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import type { ProfileRow } from '@/lib/types';
import { PixelAvatar, type AvatarKind } from './Avatar';
import { Logo } from './Logo';
import { LangToggle } from './LangToggle';

const KINDS: AvatarKind[] = ['girl', 'boy'];

/** Name + character form. Used on the first screen after sign-in and inside the student card. */
export function IdentityForm({
  initial,
  submitLabel,
  onSaved,
  onCancel,
}: {
  initial: ProfileRow | null;
  submitLabel: string;
  onSaved: (p: ProfileRow) => void;
  onCancel?: () => void;
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [name, setName] = useState(initial?.nickname ?? initial?.full_name?.split(' ')[0] ?? '');
  const [avatar, setAvatar] = useState<AvatarKind | null>((initial?.avatar as AvatarKind | null) ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return setError(t('errNick'));
    if (!avatar) return setError(t('errChar'));
    setError('');
    setSaving(true);
    const { data, error: err } = await supabase
      .from('profiles')
      .upsert({ id: user.id, nickname: name.trim().slice(0, 24), avatar, updated_at: new Date().toISOString() })
      .select()
      .single();
    setSaving(false);
    if (err) return setError(err.message);
    onSaved(data as ProfileRow);
  }

  return (
    <form className="stack stack-lg" onSubmit={submit}>
      <div className="field">
        <label htmlFor="nick">{t('nickLabel')}</label>
        <input
          id="nick"
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('nickPh')}
          autoComplete="nickname"
          autoFocus
        />
      </div>

      <div className="field">
        <span className="label" id="char-label">
          {t('charLabel')}
        </span>
        <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-labelledby="char-label">
          {KINDS.map((k) => {
            const on = avatar === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setAvatar(k)}
                className={`flex flex-col items-center gap-3 rounded-2xl border-2 bg-white p-4 transition-transform hover:-translate-y-0.5 ${
                  on ? 'border-fjord shadow-[5px_5px_0_var(--saffron)] rtl:shadow-[-5px_5px_0_var(--saffron)]' : 'border-mist'
                }`}
              >
                <PixelAvatar kind={k} size={112} bob={on} />
                <span className="font-semibold text-fjord">{t(k === 'girl' ? 'charGirl' : 'charBoy')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="msg msg-error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? t('saving') : submitLabel}
        </button>
        {onCancel && (
          <button className="btn btn-quiet" type="button" onClick={onCancel}>
            {t('cancel')}
          </button>
        )}
      </div>
    </form>
  );
}

/** First screen after sign-in: "What should we call you?" */
export default function Onboarding({ initial, onSaved }: { initial: ProfileRow | null; onSaved: (p: ProfileRow) => void }) {
  const { t } = useI18n();
  const { signOut } = useAuth();
  return (
    <div className="shell narrow">
      <header className="topbar">
        <Logo />
        <div className="topbar-actions">
          <LangToggle />
          <button className="btn btn-quiet" type="button" onClick={signOut}>
            {t('signOut')}
          </button>
        </div>
      </header>
      <div className="stack stack-lg">
        <div className="stack">
          <h1>{t('nickTitle')}</h1>
          <p className="lede">{t('nickSub')}</p>
        </div>
        <IdentityForm initial={initial} submitLabel={t('nickContinue')} onSaved={onSaved} />
      </div>
    </div>
  );
}
