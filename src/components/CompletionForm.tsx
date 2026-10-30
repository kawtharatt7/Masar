'use client';

import { FormEvent, useState } from 'react';
import { useI18n } from '@/lib/i18n';

export type CompletionValues = { description: string; url: string; issuedOn: string };

export function CompletionForm({
  kind,
  busy,
  onSubmit,
  onCancel,
}: {
  kind: 'course' | 'certification';
  busy: boolean;
  onSubmit: (v: CompletionValues) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [issuedOn, setIssuedOn] = useState(today);
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (kind === 'course' && description.trim().length < 20) return setError(t('errCourseDesc'));
    if (kind === 'certification' && !issuedOn) return setError(t('errDate'));
    if (cleanUrl) {
      try {
        const u = new URL(cleanUrl);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('protocol');
      } catch {
        return setError(t('errProjectUrl'));
      }
    }
    setError('');
    onSubmit({ description: description.trim(), url: cleanUrl, issuedOn });
  }

  return (
    <form className="stack stack-sm rounded-xl border-[1.5px] border-mist bg-white p-4" onSubmit={submit}>
      {kind === 'certification' && (
        <div className="field">
          <label htmlFor="cert-date">{t('issueDate')}</label>
          <input id="cert-date" type="date" max={today} value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />
        </div>
      )}
      <div className="field">
        <label htmlFor="completion-desc">{kind === 'course' ? t('courseLearned') : t('certNotes')}</label>
        <textarea id="completion-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="completion-url">{t('credentialUrl')}</label>
        <input id="completion-url" dir="ltr" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
      </div>
      {error && (
        <p className="msg msg-error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? t('saving') : t('saveAchievement')}
        </button>
        <button className="btn btn-quiet" type="button" onClick={onCancel}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}
