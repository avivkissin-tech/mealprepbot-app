'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  minutes: number;
}

type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1);
  } catch {
    // AudioContext not available
  }
}

export default function StepTimer({ minutes }: Props) {
  const { t } = useLanguage();
  const totalSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setStatus('done');
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const handleStart = () => setStatus('running');
  const handlePause = () => setStatus('paused');
  const handleReset = () => {
    setStatus('idle');
    setSecondsLeft(totalSeconds);
  };

  const progress = status === 'idle' ? 0 : ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div
      className="inline-flex items-center gap-1.5 mt-1.5 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Progress ring + time display */}
      <div className="relative flex items-center justify-center">
        <svg width="42" height="42" className="-rotate-90">
          <circle cx="21" cy="21" r="17" fill="none" stroke="#d1fae5" strokeWidth="3" />
          <circle
            cx="21"
            cy="21"
            r="17"
            fill="none"
            stroke={status === 'done' ? '#10b981' : '#059669'}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 17}`}
            strokeDashoffset={`${2 * Math.PI * 17 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span
          className={`absolute text-[10px] font-bold tabular-nums ${
            status === 'done' ? 'text-emerald-600' : 'text-gray-700'
          }`}
        >
          {status === 'done' ? t('timer.done') : formatTime(secondsLeft)}
        </span>
      </div>

      {/* Buttons */}
      {status === 'idle' && (
        <button
          onClick={handleStart}
          className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white bg-emerald-500 rounded-full hover:bg-emerald-600 transition-colors"
        >
          <span>▶</span>
          <span>{t('timer.start')}</span>
        </button>
      )}
      {status === 'running' && (
        <button
          onClick={handlePause}
          className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white bg-amber-500 rounded-full hover:bg-amber-600 transition-colors"
        >
          <span>⏸</span>
          <span>{t('timer.pause')}</span>
        </button>
      )}
      {status === 'paused' && (
        <button
          onClick={handleStart}
          className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white bg-emerald-500 rounded-full hover:bg-emerald-600 transition-colors"
        >
          <span>▶</span>
          <span>{t('timer.resume')}</span>
        </button>
      )}
      {status !== 'idle' && (
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <span>↺</span>
          <span>{t('timer.reset')}</span>
        </button>
      )}
    </div>
  );
}
