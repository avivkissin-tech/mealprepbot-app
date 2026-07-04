'use client';

import { useState } from 'react';
import { PrepStep } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import StepTimer from '@/components/ui/StepTimer';

interface Props {
  steps: PrepStep[];
}

export default function StepByStep({ steps }: Props) {
  const { locale } = useLanguage();
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const isDone = checked.has(i);
        const text = locale === 'he' ? step.he : step.en;

        return (
          <li
            key={i}
            style={{ display: 'flex', gap: 12, cursor: 'pointer', opacity: isDone ? 0.5 : 1, transition: 'opacity 0.15s' }}
            onClick={() => toggle(i)}
          >
            <span style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
              border: `2px solid ${isDone ? '#14422d' : '#6db88a'}`,
              background: isDone ? '#14422d' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              color: isDone ? '#fff' : '#14422d',
              transition: 'all 0.15s',
            }}>
              {isDone ? '✓' : i + 1}
            </span>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <p style={{
                fontSize: 14, color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                lineHeight: 1.65, margin: 0, transition: 'color 0.15s',
                textDecoration: isDone ? 'line-through' : 'none',
              }}>
                {text}
              </p>
              {step.timerMinutes && !isDone && (
                <StepTimer minutes={step.timerMinutes} />
              )}
            </div>
          </li>

        );
      })}
    </ol>
  );
}
