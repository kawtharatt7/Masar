'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { Logo } from './Logo';
import { LangToggle } from './LangToggle';

export default function Welcome({ onBack }: { onBack?: () => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setNotice(t('checkInbox'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="auth">
      <section className="auth-art">
        <Logo size={40} />
        <svg className="auth-route" viewBox="0 0 400 520" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <path
            className="auth-route-line"
            pathLength={1}
            d="M60 500C60 410 190 420 190 330C190 240 80 250 100 160C118 85 250 90 330 40"
            stroke="var(--saffron)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1"
          />
          <circle className="auth-dot auth-dot-1" cx="60" cy="500" r="7" fill="var(--salt)" />
          <circle className="auth-dot auth-dot-2" cx="190" cy="330" r="5" fill="var(--salt)" />
          <circle className="auth-dot auth-dot-3" cx="100" cy="160" r="5" fill="var(--salt)" />
          <circle className="auth-dot auth-dot-4" cx="330" cy="40" r="11" fill="var(--saffron)" />
        </svg>
        <div className="auth-copy">
          <h1>{t('tagline')}</h1>
          <p>{t('taglineSub')}</p>
        </div>
      </section>

      <section className="auth-form">
        <div className="auth-form-top">
          {onBack ? (
            <button type="button" className="btn btn-quiet" onClick={onBack}>
              {t('back')}
            </button>
          ) : (
            <span />
          )}
          <LangToggle />
        </div>
        <form className="stack" onSubmit={submit} noValidate={false}>
          <h2>{mode === 'in' ? t('signIn') : t('signUp')}</h2>

          {mode === 'up' && (
            <div className="field">
              <label htmlFor="name">{t('fullName')}</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">{t('email')}</label>
            <input
              id="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">{t('password')}</label>
            <input
              id="password"
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
            {mode === 'up' && <span className="hint">{t('passwordHint')}</span>}
          </div>

          {error && (
            <p className="msg msg-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="msg msg-ok" role="status">
              {notice}
            </p>
          )}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? t('working') : mode === 'in' ? t('signIn') : t('signUp')}
          </button>

          <div className="divider">
            <span>{t('or')}</span>
          </div>

          <button className="btn btn-outline" type="button" onClick={google}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            {t('google')}
          </button>

          <p className="switch">
            {mode === 'in' ? t('noAccount') : t('haveAccount')}{' '}
            <button
              type="button"
              className="link"
              onClick={() => {
                setMode(mode === 'in' ? 'up' : 'in');
                setError('');
                setNotice('');
              }}
            >
              {mode === 'in' ? t('signUp') : t('signIn')}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
