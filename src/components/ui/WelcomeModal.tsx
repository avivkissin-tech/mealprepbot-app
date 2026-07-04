'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { TOUR_KEY } from '@/components/ui/SiteTour';

const WELCOME_KEY = 'easyprep_welcome_seen';

interface Props {
  onStartTour: () => void;
}

export default function WelcomeModal({ onStartTour }: Props) {
  const { locale } = useLanguage();
  const isHe = locale === 'he';
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show once, only if tour has never been seen and welcome not dismissed
    const tourSeen = localStorage.getItem(TOUR_KEY);
    const welcomeSeen = localStorage.getItem(WELCOME_KEY);
    if (!tourSeen && !welcomeSeen) {
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(WELCOME_KEY, '1');
    setShow(false);
  }

  function startTour() {
    localStorage.setItem(WELCOME_KEY, '1');
    setShow(false);
    // small delay so modal exits before tour starts
    setTimeout(onStartTour, 200);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(26,25,24,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            dir={isHe ? 'rtl' : 'ltr'}
            style={{
              background: 'var(--bg-surface)', borderRadius: 24,
              width: '100%', maxWidth: 420,
              padding: '32px 28px',
              textAlign: 'center',
              boxShadow: '0 24px 64px rgba(26,25,24,0.2)',
            }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              {isHe ? 'ברוכים הבאים ל-Easy PREP' : 'Welcome to Easy PREP'}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(26,25,24,0.55)', margin: '0 0 28px', lineHeight: 1.6 }}>
              {isHe
                ? 'בסיור קצר נראה לכם איך לבחור מתכונים, לתכנן את השבוע, לקבל רשימת קניות ולהכין הכול יחד.'
                : "In a short tour we'll show you how to choose recipes, plan the week, get a shopping list, and prep everything together."}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={dismiss}
                style={{
                  padding: '12px 24px', borderRadius: 9999,
                  background: '#F0EBE3', border: 'none',
                  fontSize: 14, fontWeight: 600, color: '#6B6560', cursor: 'pointer',
                }}
              >
                {isHe ? 'אני רוצה לגלות לבד' : 'I\'ll explore on my own'}
              </button>
              <button
                onClick={startTour}
                style={{
                  padding: '12px 28px', borderRadius: 9999,
                  background: '#14422d', border: 'none',
                  fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
                }}
              >
                {isHe ? 'התחלת סיור' : 'Start tour'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
