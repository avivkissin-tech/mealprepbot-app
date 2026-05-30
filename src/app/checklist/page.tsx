'use client';

import { useState } from 'react';
import { checklistItems } from '@/data/checklist';
import { useLanguage } from '@/context/LanguageContext';

const STEP_ICONS = ['📦', '📋', '📅', '🧹', '🧠', '🔪', '🎵', '📝'];

export default function ChecklistPage() {
  const { locale, t } = useLanguage();
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const reset = () => setChecked(new Set());
  const total = checklistItems.length;
  const done = checked.size;
  const allDone = done === total;

  return (
    <div dir="rtl" style={{ background: '#faf9f7', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#14422d', margin: '0 0 6px' }}>
            {t('checklist.title')}
          </h1>
          <p style={{ fontSize: 14, color: '#717973', margin: 0 }}>
            {t('checklist.subtitle')}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          background: '#ffffff', borderRadius: 20, padding: '20px 24px',
          boxShadow: '0 8px 32px rgba(45,90,67,0.05)', marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#414943', fontWeight: 600 }}>
              {done} / {total} {t('checklist.steps')}
            </span>
            {done > 0 && (
              <button
                onClick={reset}
                style={{
                  fontSize: 12, color: '#717973', background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, fontWeight: 500,
                }}
              >
                {t('checklist.reset')}
              </button>
            )}
          </div>
          <div style={{ height: 6, background: '#efeeec', borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#14422d', borderRadius: 9999,
              width: `${(done / total) * 100}%`, transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#717973' }}>
            {Math.round((done / total) * 100)}% הושלם
          </div>
        </div>

        {/* All done banner */}
        {allDone && (
          <div style={{
            marginBottom: 24, background: 'rgba(20,66,45,0.07)',
            border: '1px solid rgba(20,66,45,0.15)', borderRadius: 16,
            padding: '16px 20px', textAlign: 'center',
            fontSize: 15, fontWeight: 700, color: '#14422d',
          }}>
            🎉 {t('checklist.done')}
          </div>
        )}

        {/* Checklist items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {checklistItems.map((item, i) => {
            const isDone = checked.has(item.id);
            const title = locale === 'he' ? item.titleHe : item.titleEn;
            const description = locale === 'he' ? item.descriptionHe : item.descriptionEn;

            return (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  background: isDone ? 'rgba(20,66,45,0.04)' : '#ffffff',
                  borderRadius: 16, padding: '16px 20px',
                  cursor: 'pointer', userSelect: 'none',
                  border: isDone ? '1px solid rgba(20,66,45,0.12)' : '1px solid #efeeec',
                  boxShadow: isDone ? 'none' : '0 2px 8px rgba(45,90,67,0.04)',
                  transition: 'all 0.15s',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  flexShrink: 0, width: 40, height: 40, borderRadius: 12,
                  border: `2px solid ${isDone ? '#14422d' : '#c0c9c1'}`,
                  background: isDone ? '#14422d' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isDone ? 16 : 18, color: isDone ? '#ffffff' : 'inherit',
                  transition: 'all 0.15s',
                }}>
                  {isDone ? '✓' : STEP_ICONS[i] ?? String(i + 1)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 600, margin: '0 0 4px',
                    color: isDone ? '#717973' : '#1a1c1b',
                    textDecoration: isDone ? 'line-through' : 'none',
                    transition: 'all 0.15s',
                  }}>
                    {title}
                  </p>
                  <p style={{
                    fontSize: 13, margin: 0, lineHeight: 1.5,
                    color: isDone ? '#c0c9c1' : '#414943',
                    transition: 'all 0.15s',
                  }}>
                    {description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip */}
        <p style={{
          marginTop: 32, textAlign: 'center', fontSize: 12,
          color: '#c0c9c1', fontStyle: 'italic',
        }}>
          {t('checklist.tip')}
        </p>
      </div>
    </div>
  );
}
