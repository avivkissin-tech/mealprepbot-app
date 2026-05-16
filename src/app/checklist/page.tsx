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
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('checklist.title')}</h1>
        <p className="text-gray-500">{t('checklist.subtitle')}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>
            {t('checklist.progress')}: {done} {t('checklist.of')} {total} {t('checklist.steps')}
          </span>
          {done > 0 && (
            <button
              onClick={reset}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              {t('checklist.reset')}
            </button>
          )}
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      </div>

      {/* All done banner */}
      {allDone && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center text-emerald-700 font-semibold text-lg">
          {t('checklist.done')}
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-3">
        {checklistItems.map((item, i) => {
          const isDone = checked.has(item.id);
          const title = locale === 'he' ? item.titleHe : item.titleEn;
          const description = locale === 'he' ? item.descriptionHe : item.descriptionEn;

          return (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`group flex gap-4 rounded-2xl border p-4 cursor-pointer transition-all select-none ${
                isDone
                  ? 'bg-emerald-50 border-emerald-200 opacity-70'
                  : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-sm'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg transition-colors ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-gray-200 group-hover:border-emerald-300'
                }`}
              >
                {isDone ? '✓' : STEP_ICONS[i] ?? String(i + 1)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm transition-all ${
                    isDone ? 'line-through text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {title}
                </p>
                <p
                  className={`text-sm mt-0.5 transition-all ${
                    isDone ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <p className="mt-8 text-center text-sm text-gray-400 italic">{t('checklist.tip')}</p>
    </div>
  );
}
