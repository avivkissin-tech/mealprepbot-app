'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export const TOUR_KEY = 'easyprep_tour_seen_v2';

interface TourStep {
  targetId: string;
  titleHe: string;
  titleEn: string;
  bodyHe: string;
  bodyEn: string;
}

const STEPS: TourStep[] = [
  {
    targetId: 'tour-recipes',
    titleHe: '📖 מתכוני מילפרפ',
    titleEn: '📖 Meal Prep Recipes',
    bodyHe: 'גלל בין המתכונים — כל מתכון מגיע עם רשימת קניות, שלבי הכנה וטיימר בישול.',
    bodyEn: 'Browse recipes — each comes with a shopping list, prep steps, and a cooking timer.',
  },
  {
    targetId: 'tour-checklist',
    titleHe: '📋 תכנון מילפרפ',
    titleEn: '📋 Meal Prep Planner',
    bodyHe: 'בחר מתכונים, קבל רשימת קניות מסוכמת, הוסף ליומן גוגל ותתחיל לבשל.',
    bodyEn: 'Pick recipes, get a merged shopping list, add to Google Calendar, and start cooking.',
  },
  {
    targetId: 'tour-planner',
    titleHe: '🗓 פלאנר שבועי',
    titleEn: '🗓 Weekly Planner',
    bodyHe: 'תכנן כל יום בשבוע — הוסף מתכונים לכל ארוחה וקבל רשימת קניות שבועית.',
    bodyEn: 'Plan each day of the week — assign recipes to meals and get a weekly shopping list.',
  },
  {
    targetId: 'tour-wizard',
    titleHe: '🤖 מדריך AI',
    titleEn: '🤖 AI Guide',
    bodyHe: 'לחץ כאן לקבלת מדריך בישול AI אישי שמותאם למתכונים שבחרת.',
    bodyEn: 'Click here for a personalized AI cooking guide tailored to your selected recipes.',
  },
];

interface TooltipPos { top: number; left: number; }

// Only starts when forceShow=true — no auto-start
export default function SiteTour({ forceShow = false, onDone }: { forceShow?: boolean; onDone?: () => void }) {
  const { locale } = useLanguage();
  const isHe = locale === 'he';
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<TooltipPos | null>(null);

  const updatePos = useCallback((stepIndex: number) => {
    const id = STEPS[stepIndex]?.targetId;
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.bottom + window.scrollY + 10, left: rect.left + window.scrollX });
  }, []);

  useEffect(() => {
    if (forceShow) {
      setStep(0);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [forceShow]);

  useEffect(() => {
    if (visible) updatePos(step);
  }, [visible, step, updatePos]);

  function finish() {
    setVisible(false);
    localStorage.setItem(TOUR_KEY, '1');
    onDone?.();
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  }

  function prev() {
    if (step > 0) setStep(s => s - 1);
  }

  if (!visible) return null;
  const current = STEPS[step];

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(26,25,24,0.4)', pointerEvents: 'none' }}
          />
          {pos && (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              dir={isHe ? 'rtl' : 'ltr'}
              style={{
                position: 'absolute', top: pos.top, left: pos.left,
                zIndex: 8001, width: 280,
                background: '#fff', borderRadius: 16,
                boxShadow: '0 12px 40px rgba(26,25,24,0.2)',
                padding: '16px 18px', border: '1px solid #E0D9CE',
              }}
            >
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{ height: 4, flex: 1, borderRadius: 9999, background: i <= step ? '#14422d' : '#E0D9CE', transition: 'background 0.2s' }} />
                ))}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a1c1b', margin: '0 0 6px' }}>
                {isHe ? current.titleHe : current.titleEn}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(26,25,24,0.6)', margin: '0 0 14px', lineHeight: 1.6 }}>
                {isHe ? current.bodyHe : current.bodyEn}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={finish} style={{ background: 'none', border: 'none', fontSize: 12, color: '#A09893', cursor: 'pointer', padding: 0 }}>
                  {isHe ? 'דלג' : 'Skip'}
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  {step > 0 && (
                    <button onClick={prev} style={{ padding: '7px 14px', borderRadius: 9999, background: '#F0EBE3', border: 'none', fontSize: 12, fontWeight: 600, color: '#6B6560', cursor: 'pointer' }}>
                      {isHe ? '→' : '←'}
                    </button>
                  )}
                  <button onClick={next} style={{ padding: '7px 16px', borderRadius: 9999, background: '#14422d', border: 'none', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                    {step < STEPS.length - 1 ? (isHe ? 'הבא ←' : 'Next →') : (isHe ? 'סיום ✓' : 'Done ✓')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
