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
  const circumference = 2 * Math.PI * 17;

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, userSelect: 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Progress ring + time display */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="42" height="42" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="21" cy="21" r="17" fill="none" stroke="var(--border)" strokeWidth="3" />
          <circle
            cx="21" cy="21" r="17" fill="none"
            stroke="#14422d"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span style={{
          position: 'absolute',
          fontSize: 10, fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: status === 'done' ? '#14422d' : 'var(--text-primary)',
        }}>
          {status === 'done' ? t('timer.done') : formatTime(secondsLeft)}
        </span>
      </div>

      {/* Buttons */}
      {status === 'idle' && (
        <button
          onClick={handleStart}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', fontSize: 12, fontWeight: 600,
            color: '#fff', background: '#14422d',
            border: 'none', borderRadius: 9999, cursor: 'pointer',
          }}
        >
          <span>▶</span>
          <span>{t('timer.start')}</span>
        </button>
      )}
      {status === 'running' && (
        <button
          onClick={handlePause}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', fontSize: 12, fontWeight: 600,
            color: '#fff', background: '#C9572A',
            border: 'none', borderRadius: 9999, cursor: 'pointer',
          }}
        >
          <span>⏸</span>
          <span>{t('timer.pause')}</span>
        </button>
      )}
      {status === 'paused' && (
        <button
          onClick={handleStart}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', fontSize: 12, fontWeight: 600,
            color: '#fff', background: '#14422d',
            border: 'none', borderRadius: 9999, cursor: 'pointer',
          }}
        >
          <span>▶</span>
          <span>{t('timer.resume')}</span>
        </button>
      )}
      {status !== 'idle' && (
        <button
          onClick={handleReset}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', fontSize: 12, fontWeight: 600,
            color: 'var(--text-secondary)', background: 'var(--bg-muted)',
            border: 'none', borderRadius: 9999, cursor: 'pointer',
          }}
        >
          <span>↺</span>
          <span>{t('timer.reset')}</span>
        </button>
      )}
    </div>
  );
}
