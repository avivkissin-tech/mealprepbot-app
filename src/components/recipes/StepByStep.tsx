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
            className={`flex gap-3 cursor-pointer group transition-opacity ${isDone ? 'opacity-50' : ''}`}
            onClick={() => toggle(i)}
          >
            <span
              className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
                isDone
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-emerald-300 text-emerald-600 group-hover:border-emerald-500'
              }`}
            >
              {isDone ? '✓' : i + 1}
            </span>
            <div className="flex-1 pt-0.5">
              <p
                className={`text-sm text-gray-700 leading-relaxed transition-all ${
                  isDone ? 'line-through text-gray-400' : ''
                }`}
              >
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
