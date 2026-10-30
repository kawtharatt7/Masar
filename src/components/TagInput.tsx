'use client';

import { useState } from 'react';

export function TagInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState('');

  function commit(raw: string) {
    const items = raw
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    const next = [...value];
    for (const item of items) {
      if (!next.some((v) => v.toLowerCase() === item.toLowerCase())) next.push(item);
    }
    onChange(next.slice(0, 40));
    setDraft('');
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="flex flex-wrap gap-2 rounded-[10px] border-[1.5px] border-mist bg-white p-2 focus-within:border-teal focus-within:ring-4 focus-within:ring-teal-soft">
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-teal-soft py-0.5 ps-3 pe-1 text-sm font-semibold text-fjord"
          >
            {v}
            <button
              type="button"
              aria-label={`${v} ×`}
              className="grid size-6 place-items-center rounded-full leading-none hover:bg-white"
              onClick={() => onChange(value.filter((x) => x !== v))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="w-auto min-w-32 flex-1 basis-32 border-0 bg-transparent p-1.5 shadow-none focus:shadow-none"
          onChange={(e) => {
            const v = e.target.value;
            if (/[,،]$/.test(v)) commit(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit(draft);
            } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
        />
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
