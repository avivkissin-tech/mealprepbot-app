'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, SkipForward } from 'lucide-react';
import { Recipe, ScheduledStep } from '@/types';
import { scheduleMealPrep, estimateTotalMinutes, formatTimerMinutes } from '@/lib/mealPrepScheduler';

const RECIPE_COLORS = ['#2A4F3A', '#C9572A', '#5B7FA6', '#8B5E3C', '#7A5EA6'];

interface ActiveTimer {
  id: number;
  recipeName: string;
  color: string;
  totalSeconds: number;
  remaining: number;
  status: 'running' | 'paused' | 'done';
  stepText: string;
}

interface Props {
  selectedRecipes: Recipe[];
  onClose: () => void;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch { /* ignore */ }
}

export default function MealPrepSession({ selectedRecipes, onClose }: Props) {
  const steps = useMemo(() => scheduleMealPrep(selectedRecipes), [selectedRecipes]);
  const totalMinutes = useMemo(() => estimateTotalMinutes(steps), [steps]);

  const recipeColorMap = useMemo(() => {
    const map = new Map<string, string>();
    selectedRecipes.forEach((r, i) => map.set(r.id, RECIPE_COLORS[i % RECIPE_COLORS.length]));
    return map;
  }, [selectedRecipes]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [skipped, setSkipped]           = useState<Set<number>>(new Set());
  const [activeTimers, setActiveTimers] = useState<Map<number, ActiveTimer>>(new Map());
  const timerIdRef       = useRef(0);
  const lastAdvanceRef   = useRef(0);
  const touchStartYRef   = useRef(0);

  // Single interval drives all timers
  useEffect(() => {
    const id = setInterval(() => {
      setActiveTimers(prev => {
        let changed = false;
        const next = new Map(prev);
        for (const [key, timer] of next) {
          if (timer.status === 'running') {
            changed = true;
            if (timer.remaining <= 1) {
              next.set(key, { ...timer, remaining: 0, status: 'done' });
              playBeep();
            } else {
              next.set(key, { ...timer, remaining: timer.remaining - 1 });
            }
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const isDone = currentIndex >= steps.length;
  const currentStep = steps[currentIndex];

  const advance = useCallback(() => {
    setCurrentIndex(i => i + 1);
  }, []);

  const skip = useCallback(() => {
    setSkipped(prev => new Set(prev).add(currentIndex));
    setCurrentIndex(i => i + 1);
  }, [currentIndex]);

  const tryAdvance = useCallback(() => {
    const now = Date.now();
    if (now - lastAdvanceRef.current < 600) return;
    lastAdvanceRef.current = now;
    setCurrentIndex(i => i + 1);
  }, []);

  const tryBack = useCallback(() => {
    const now = Date.now();
    if (now - lastAdvanceRef.current < 600) return;
    lastAdvanceRef.current = now;
    setCurrentIndex(i => Math.max(0, i - 1));
  }, []);

  function startTimer(step: ScheduledStep) {
    if (!step.step.timerMinutes) return;
    const id = ++timerIdRef.current;
    const color = recipeColorMap.get(step.recipeId) ?? '#2A4F3A';
    setActiveTimers(prev => {
      const next = new Map(prev);
      next.set(id, {
        id,
        recipeName: step.recipeName,
        color,
        totalSeconds: step.step.timerMinutes! * 60,
        remaining: step.step.timerMinutes! * 60,
        status: 'running',
        stepText: step.step.he,
      });
      return next;
    });
  }

  function toggleTimer(id: number) {
    setActiveTimers(prev => {
      const t = prev.get(id);
      if (!t) return prev;
      const next = new Map(prev);
      next.set(id, { ...t, status: t.status === 'running' ? 'paused' : 'running' });
      return next;
    });
  }

  function removeTimer(id: number) {
    setActiveTimers(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  function formatSeconds(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function getStepTypeLabel(type: ScheduledStep['type']) {
    if (type === 'passive_start') return 'התחלה';
    if (type === 'passive_wait') return 'המתנה';
    return 'הכנה';
  }

  const timersArray = Array.from(activeTimers.values());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,25,24,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        dir="rtl"
        style={{
          width: '100%', maxWidth: 560,
          background: '#F7F3EE',
          borderRadius: '24px 24px 0 0',
          height: '96dvh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 12px',
          borderBottom: '1px solid #E0D9CE',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1918', margin: 0 }}>
              מילפרפ פעיל
            </h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6B6560' }}
            >
              <X size={20} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(26,25,24,0.5)', margin: 0 }}>
            {selectedRecipes.map(r => r.nameHe).join(' · ')} · ~{formatTimerMinutes(totalMinutes)}
          </p>
        </div>

        {/* Active Timers Bar */}
        <AnimatePresence>
          {timersArray.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: '#fff',
                borderBottom: '1px solid #E0D9CE',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '10px 16px',
                display: 'flex', gap: 8, overflowX: 'auto',
                scrollbarWidth: 'none',
              }}>
                {timersArray.map(timer => (
                  <div
                    key={timer.id}
                    style={{
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: timer.status === 'done' ? '#E8F5EC' : '#fff',
                      border: `1.5px solid ${timer.color}`,
                      borderRadius: 12,
                      padding: '7px 12px',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: timer.color,
                      animation: timer.status === 'running' ? 'pulse 1s infinite' : 'none',
                    }} />
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(26,25,24,0.5)', marginBottom: 1 }}>
                        {timer.recipeName}
                      </div>
                      <div style={{
                        fontSize: 16, fontWeight: 700,
                        color: timer.status === 'done' ? '#2A4F3A' : '#1A1918',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {timer.status === 'done' ? '✓' : formatSeconds(timer.remaining)}
                      </div>
                    </div>
                    <button
                      onClick={() => timer.status === 'done' ? removeTimer(timer.id) : toggleTimer(timer.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 14, padding: '2px 4px', color: '#6B6560',
                      }}
                    >
                      {timer.status === 'done' ? '×' : timer.status === 'running' ? '⏸' : '▶'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable content */}
        <div
          style={{ flex: 1, overflowY: isDone ? 'auto' : 'hidden', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
          onWheel={isDone ? undefined : (e) => { if (e.deltaY > 30) tryAdvance(); else if (e.deltaY < -30) tryBack(); }}
          onTouchStart={(e) => { touchStartYRef.current = e.touches[0].clientY; }}
          onTouchEnd={isDone ? undefined : (e) => {
            const delta = touchStartYRef.current - e.changedTouches[0].clientY;
            if (delta > 50) tryAdvance();
            else if (delta < -50) tryBack();
          }}
        >

          {isDone ? (
            /* Completion Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '24px 16px' }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1918', marginBottom: 8 }}>
                כל הכבוד! סיימת
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(26,25,24,0.55)', marginBottom: 24 }}>
                {steps.length - skipped.size} שלבים הושלמו
              </p>

              {/* Storage summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'right' }}>
                {selectedRecipes.map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '12px 16px',
                      borderRight: `3px solid ${RECIPE_COLORS[i % RECIPE_COLORS.length]}`,
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#1A1918', margin: '0 0 4px' }}>
                      {r.nameHe}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(26,25,24,0.55)', margin: 0 }}>
                      📦 שמור עד {r.storageDays} ימים בקירור
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                style={{
                  marginTop: 24,
                  padding: '12px 32px',
                  borderRadius: 9999,
                  background: '#2A4F3A', color: '#F7F3EE',
                  fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                }}
              >
                סגור
              </button>
            </motion.div>
          ) : (
            <>
              {/* Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(26,25,24,0.5)' }}>
                    שלב {currentIndex + 1} מתוך {steps.length}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(26,25,24,0.5)' }}>
                    {Math.round(((currentIndex) / steps.length) * 100)}%
                  </span>
                </div>
                <div style={{ height: 4, background: '#E0D9CE', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${(currentIndex / steps.length) * 100}%` }}
                    style={{ height: '100%', background: '#2A4F3A', borderRadius: 4 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Current Step Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: '0 4px 16px rgba(26,25,24,0.08)',
                  }}
                >
                  {/* Recipe badge + type */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: recipeColorMap.get(currentStep.recipeId) ?? '#2A4F3A',
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(26,25,24,0.6)' }}>
                        {currentStep.recipeName}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: currentStep.type === 'passive_start' ? '#EBF2ED'
                        : currentStep.type === 'passive_wait' ? '#FEF3EE' : '#F5F3F0',
                      color: currentStep.type === 'passive_start' ? '#2A4F3A'
                        : currentStep.type === 'passive_wait' ? '#C9572A' : '#6B6560',
                      fontWeight: 600,
                    }}>
                      {getStepTypeLabel(currentStep.type)}
                    </span>
                  </div>

                  {/* Step text */}
                  <p style={{ fontSize: 17, lineHeight: 1.6, color: '#1A1918', margin: '0 0 16px', fontWeight: 500 }}>
                    {currentStep.step.he}
                  </p>

                  {/* Timer + parallelize hint */}
                  {currentStep.step.timerMinutes && (
                    <div style={{ marginBottom: 16 }}>
                      <button
                        onClick={() => startTimer(currentStep)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 9999,
                          background: '#EBF2ED', border: 'none', cursor: 'pointer',
                          fontSize: 13, fontWeight: 600, color: '#2A4F3A',
                        }}
                      >
                        ⏱ התחל טיימר — {formatTimerMinutes(currentStep.step.timerMinutes)}
                      </button>
                      {currentStep.canParallelize && (
                        <p style={{ fontSize: 12, color: '#C9572A', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ChevronLeft size={13} />
                          בזמן ההמתנה תוכל לבצע את השלב הבא
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={advance}
                      style={{
                        flex: 1, padding: '14px 0', borderRadius: 12,
                        background: '#2A4F3A', color: '#F7F3EE',
                        fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      שלב הבא ↓
                    </button>
                    <button
                      onClick={skip}
                      style={{
                        padding: '11px 16px', borderRadius: 12,
                        background: '#F0EBE3', color: 'rgba(26,25,24,0.55)',
                        fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <SkipForward size={14} />
                      דלג
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Next steps preview */}
              {steps.slice(currentIndex + 1, currentIndex + 3).length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: 'rgba(26,25,24,0.4)', marginBottom: 8, fontWeight: 600 }}>
                    הבא בתור
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {steps.slice(currentIndex + 1, currentIndex + 3).map((s, i) => (
                      <div
                        key={currentIndex + 1 + i}
                        style={{
                          background: 'rgba(255,255,255,0.6)',
                          borderRadius: 12, padding: '12px 14px',
                          opacity: i === 0 ? 0.7 : 0.45,
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}
                      >
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: recipeColorMap.get(s.recipeId) ?? '#2A4F3A',
                        }} />
                        <p style={{
                          fontSize: 13, color: '#1A1918', margin: 0,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {s.step.he}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
