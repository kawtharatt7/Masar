'use client';

import { FormEvent, useState } from 'react';
import { useI18n } from '@/lib/i18n';

export type ProofValues = { title: string; description: string; url: string };

export function ProofForm({
  placeholder,
  busy,
  onSubmit,
  onCancel,
}: {
  placeholder?: string;
  busy: boolean;
  onSubmit: (v: ProofValues) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (title.trim().length < 3) return setError(t('errProjectName'));
    if (description.trim().length < 30) return setError(t('errProjectDesc'));
    if (cleanUrl) {
      try {
        const u = new URL(cleanUrl);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('protocol');
      } catch {
        return setError(t('errProjectUrl'));
      }
    }
    setError('');
    onSubmit({ title: title.trim(), description: description.trim(), url: cleanUrl });
  }

  return (
    <form className="stack stack-sm rounded-xl border-[1.5px] border-mist bg-white p-4" onSubmit={submit}>
      <p className="hint">{t('docIntro')}</p>
      <div className="field">
        <label htmlFor="proof-title">{t('projectName')}</label>
        <input id="proof-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={placeholder} />
      </div>
      <div className="field">
        <label htmlFor="proof-desc">{t('projectDesc')}</label>
        <textarea id="proof-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="proof-url">{t('projectUrl')}</label>
        <input
          id="proof-url"
          dir="ltr"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('projectUrlPh')}
        />
      </div>
      {error && (
        <p className="msg msg-error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? t('saving') : t('submitProject')}
        </button>
        <button className="btn btn-quiet" type="button" onClick={onCancel}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}
