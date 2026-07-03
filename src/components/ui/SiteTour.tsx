'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { Compass, CalendarDays, Refrigerator, ChevronLeft, ChevronRight } from 'lucide-react';

export const TOUR_KEY = 'easyprep_tour_seen_v2';

// ─── Tour definitions ──────────────────────────────────────────────────────────

export type TourType = 'general' | 'planner' | 'fridge';

interface TourStep {
  targetId: string;
  titleHe: string;
  titleEn: string;
  bodyHe: string;
  bodyEn: string;
  page?: string; // navigate here before showing
}

const TOURS: Record<TourType, TourStep[]> = {
  general: [
    {
      page: '/dashboard',
      targetId: 'tour-recipes',
      titleHe: 'מאגר המתכונים',
      titleEn: 'Recipe Library',
      bodyHe: 'כאן תמצא את כל מתכוני המילפרפ. לחץ על מתכון לפתיחה, שמור אחד, ותוכל לצפות בשלבי ההכנה וטיימר בישול.',
      bodyEn: 'Find all your meal prep recipes here. Open one, save it, and follow the prep steps with a built-in timer.',
    },
    {
      page: '/checklist',
      targetId: 'tour-checklist-title',
      titleHe: 'תכנון מילפרפ',
      titleEn: 'Meal Prep Planner',
      bodyHe: 'בחר מתכונים לשבוע, הגדר כמה אנשים ולכמה ימים — הוסף את הקניות ליומן גוגל וקבל רשימת קניות מפורטת.',
      bodyEn: 'Select recipes for the week, set people & days — export to Google Calendar and get a detailed shopping list.',
    },
    {
      page: '/planner',
      targetId: 'tour-planner-title',
      titleHe: 'פלאנר שבועי',
      titleEn: 'Weekly Planner',
      bodyHe: 'תכנן ארוחות לכל יום בשבוע, קבל רשימת קניות מאוחדת, ותתחיל בישול מסודר עם הטיימר המובנה.',
      bodyEn: 'Plan meals for every day, get a merged shopping list, and start a guided cooking session.',
    },
    {
      page: '/planner',
      targetId: 'tour-planner-people',
      titleHe: 'עבור כמה אנשים?',
      titleEn: 'How many people?',
      bodyHe: 'שנה כאן את מספר האנשים — כל הכמויות ברשימת הקניות יתעדכנו אוטומטית.',
      bodyEn: 'Change the number of people here — all quantities in your shopping list update automatically.',
    },
    {
      page: '/ingredients',
      targetId: 'tour-fridge-title',
      titleHe: 'מה יש לי במקרר',
      titleEn: "What's in my fridge",
      bodyHe: 'הזן מוצרים שיש לך בבית — האתר ימצא מתכונים שמתאימים בדיוק למה שיש לך.',
      bodyEn: 'Enter items you have at home — the app finds recipes that match exactly what you have.',
    },
  ],
  planner: [
    {
      page: '/planner',
      targetId: 'tour-planner-title',
      titleHe: 'הפלאנר השבועי',
      titleEn: 'Weekly Planner',
      bodyHe: 'ברוך הבא לפלאנר! כאן תתכנן את כל ארוחות השבוע שלך.',
      bodyEn: 'Welcome to the planner! Here you\'ll plan all your weekly meals.',
    },
    {
      page: '/planner',
      targetId: 'tour-planner-people',
      titleHe: 'מכין עבור כמה?',
      titleEn: 'Cooking for how many?',
      bodyHe: 'קבע כאן את מספר האנשים — כל הכמויות יחושבו בהתאם אוטומטית.',
      bodyEn: 'Set the number of people here — all quantities are calculated automatically.',
    },
    {
      page: '/planner',
      targetId: 'tour-planner-add',
      titleHe: 'הוסף מתכון ליום',
      titleEn: 'Add a recipe to a day',
      bodyHe: 'לחץ על + בכל עמודת יום להוסיף מתכון. אפשר להוסיף כמה מתכונים לכל יום.',
      bodyEn: 'Click + on any day column to add a recipe. You can add multiple recipes per day.',
    },
    {
      page: '/planner',
      targetId: 'tour-planner-shopping',
      titleHe: 'רשימת קניות',
      titleEn: 'Shopping List',
      bodyHe: 'לחץ על רשימת קניות לקבלת כל המרכיבים המאוחדים לכל השבוע, ממוינים לפי קטגוריה.',
      bodyEn: 'Click Shopping List to get all ingredients merged for the whole week, sorted by category.',
    },
  ],
  fridge: [
    {
      page: '/ingredients',
      targetId: 'tour-fridge-title',
      titleHe: 'מה יש לי במקרר',
      titleEn: "What's in my fridge",
      bodyHe: 'הזן מוצרים שיש לך בבית — שם, כמות, כל מה שתרצה. האתר ימצא מתכונים שמתאימים בדיוק למה שיש לך.',
      bodyEn: 'Enter items you have at home — name, quantity, anything. The app finds recipes that match what you have.',
    },
    {
      page: '/ingredients',
      targetId: 'tour-fridge-input',
      titleHe: 'הזן מוצרים',
      titleEn: 'Enter ingredients',
      bodyHe: 'כתוב את שם המוצר — למשל "עוף, ביצים, קישואים" — ולחץ Enter או חפש.',
      bodyEn: 'Type an ingredient — e.g. "chicken, eggs, zucchini" — and press Enter or search.',
    },
  ],
};

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  forceShow?: boolean;
  initialTourType?: TourType;
  onDone?: () => void;
}

interface TargetRect { x: number; y: number; width: number; height: number; }
interface TooltipPos { top: number; left: number; flip?: boolean; targetRect: TargetRect; }

const SPOTLIGHT_PAD = 12; // px around the highlighted element

export default function SiteTour({ forceShow = false, initialTourType, onDone }: Props) {
  const { locale } = useLanguage();
  const isHe = locale === 'he';
  const router = useRouter();

  const [showMenu, setShowMenu] = useState(false);
  const [tourType, setTourType] = useState<TourType | null>(null);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const navigatingRef = useRef(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  // Calculate tooltip position + target rect for spotlight
  const updatePos = useCallback((stepIndex: number, type: TourType) => {
    const steps = TOURS[type];
    const id = steps[stepIndex]?.targetId;
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) {
      setPos(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const tooltipH = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const flip = spaceBelow < tooltipH + 20;
    setPos({
      top: flip ? rect.top - SPOTLIGHT_PAD - 10 : rect.bottom + SPOTLIGHT_PAD + 10,
      left: Math.min(rect.left, window.innerWidth - 316),
      flip,
      targetRect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
    });
  }, []);

  // When forceShow fires, show the tour menu (or start specific tour)
  useEffect(() => {
    if (forceShow) {
      if (initialTourType) {
        startTour(initialTourType);
      } else {
        setShowMenu(true);
      }
    } else {
      setShowMenu(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceShow, initialTourType]);

  // Reposition on step/type change
  useEffect(() => {
    if (visible && tourType) {
      updatePos(step, tourType);
    }
  }, [visible, step, tourType, updatePos]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!visible) return;
    const handler = () => { if (tourType) updatePos(stepRef.current, tourType); };
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler, { passive: true });
    return () => { window.removeEventListener('scroll', handler); window.removeEventListener('resize', handler); };
  }, [visible, tourType, updatePos]);

  async function startTour(type: TourType) {
    setTourType(type);
    setStep(0);
    setShowMenu(false);

    const firstStep = TOURS[type][0];
    if (firstStep?.page) {
      navigatingRef.current = true;
      router.push(firstStep.page);
      // Wait for navigation + render
      await new Promise(r => setTimeout(r, 600));
      navigatingRef.current = false;
    }
    setVisible(true);
    setTimeout(() => tourType && updatePos(0, type), 100);
  }

  async function goNext() {
    if (!tourType) return;
    const steps = TOURS[tourType];
    if (step < steps.length - 1) {
      const nextStep = step + 1;
      const next = steps[nextStep];
      const current = steps[step];

      if (next.page && next.page !== current.page) {
        setVisible(false);
        navigatingRef.current = true;
        router.push(next.page);
        await new Promise(r => setTimeout(r, 600));
        navigatingRef.current = false;
      }
      setStep(nextStep);
      setVisible(true);
      setTimeout(() => updatePos(nextStep, tourType), 100);
    } else {
      finish();
    }
  }

  async function goPrev() {
    if (!tourType || step === 0) return;
    const steps = TOURS[tourType];
    const prevStep = step - 1;
    const prev = steps[prevStep];
    const current = steps[step];

    if (prev.page && prev.page !== current.page) {
      setVisible(false);
      router.push(prev.page);
      await new Promise(r => setTimeout(r, 600));
    }
    setStep(prevStep);
    setVisible(true);
    setTimeout(() => updatePos(prevStep, tourType), 100);
  }

  function finish() {
    setVisible(false);
    setTourType(null);
    setShowMenu(false);
    localStorage.setItem(TOUR_KEY, '1');
    onDone?.();
  }

  const steps = tourType ? TOURS[tourType] : [];
  const current = steps[step];

  const TOUR_OPTIONS: { type: TourType; labelHe: string; labelEn: string; icon: React.ReactNode; descHe: string; descEn: string }[] = [
    { type: 'general', icon: <Compass size={22} strokeWidth={1.75} />, labelHe: 'סיור כללי', labelEn: 'General Tour', descHe: 'הכר את כל חלקי האתר', descEn: 'Get to know all parts of the app' },
    { type: 'planner', icon: <CalendarDays size={22} strokeWidth={1.75} />, labelHe: 'הפלאנר השבועי', labelEn: 'Weekly Planner', descHe: 'למד איך לתכנן את השבוע', descEn: 'Learn how to plan your week' },
    { type: 'fridge', icon: <Refrigerator size={22} strokeWidth={1.75} />, labelHe: 'מה יש לי במקרר', labelEn: 'Fridge Recipes', descHe: 'מצא מתכונים לפי מה שיש בבית', descEn: 'Find recipes from what you have' },
  ];

  return (
    <>
      {/* ── Tour selection menu ── */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) { setShowMenu(false); onDone?.(); } }}
            style={{ position: 'fixed', inset: 0, zIndex: 9200, background: 'rgba(26,25,24,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              dir={isHe ? 'rtl' : 'ltr'}
              style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, padding: '28px 24px', boxShadow: '0 20px 60px rgba(26,25,24,0.18)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1c1b', margin: '0 0 4px' }}>
                    {isHe ? 'בחר סיור' : 'Choose a Tour'}
                  </h2>
                  <p style={{ fontSize: 12, color: 'rgba(26,25,24,0.5)', margin: 0 }}>
                    {isHe ? 'כל סיור מסביר חלק אחר באתר' : 'Each tour explains a different part of the app'}
                  </p>
                </div>
                <button onClick={() => { setShowMenu(false); onDone?.(); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#A09893', padding: 0, lineHeight: 1 }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TOUR_OPTIONS.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => startTour(opt.type)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1.5px solid #E0D9CE', background: '#faf9f7', cursor: 'pointer', textAlign: isHe ? 'right' : 'left', transition: 'border-color 0.15s, background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#14422d'; e.currentTarget.style.background = '#EBF2ED'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D9CE'; e.currentTarget.style.background = '#faf9f7'; }}
                  >
                    <span style={{ flexShrink: 0, color: '#14422d', display: 'flex', alignItems: 'center' }}>{opt.icon}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1c1b', margin: '0 0 2px' }}>{isHe ? opt.labelHe : opt.labelEn}</p>
                      <p style={{ fontSize: 11, color: 'rgba(26,25,24,0.5)', margin: 0 }}>{isHe ? opt.descHe : opt.descEn}</p>
                    </div>
                    <span style={{ marginInlineStart: 'auto', color: '#14422d', display: 'flex', alignItems: 'center' }}>
                      <ChevronLeft size={16} strokeWidth={2} />
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active tour tooltip ── */}
      <AnimatePresence>
        {visible && current && (
          <>
            {/* Spotlight SVG overlay — dims everything except the target */}
            {pos ? (
              <motion.svg
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 8000, pointerEvents: 'none' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <mask id="tour-spotlight-mask">
                    {/* White = visible (dimmed) */}
                    <rect width="100%" height="100%" fill="white" />
                    {/* Black = cutout (bright) */}
                    <rect
                      x={pos.targetRect.x - SPOTLIGHT_PAD}
                      y={pos.targetRect.y - SPOTLIGHT_PAD}
                      width={pos.targetRect.width + SPOTLIGHT_PAD * 2}
                      height={pos.targetRect.height + SPOTLIGHT_PAD * 2}
                      rx={14}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(26,25,24,0.55)" mask="url(#tour-spotlight-mask)" />
              </motion.svg>
            ) : (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(26,25,24,0.45)', pointerEvents: 'none' }}
              />
            )}

            {/* Spotlight border ring around target */}
            {pos && (
              <motion.div
                key={`ring-${tourType}-${step}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'fixed',
                  top: pos.targetRect.y - SPOTLIGHT_PAD,
                  left: pos.targetRect.x - SPOTLIGHT_PAD,
                  width: pos.targetRect.width + SPOTLIGHT_PAD * 2,
                  height: pos.targetRect.height + SPOTLIGHT_PAD * 2,
                  borderRadius: 14,
                  border: '2.5px solid #14422d',
                  boxShadow: '0 0 0 4px rgba(20,66,45,0.18), 0 8px 32px rgba(20,66,45,0.15)',
                  pointerEvents: 'none',
                  zIndex: 8001,
                }}
              />
            )}

            {/* Tooltip */}
            {pos && (
              <motion.div
                key={`${tourType}-${step}`}
                initial={{ opacity: 0, y: pos.flip ? 8 : -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: pos.flip ? 8 : -8 }}
                transition={{ duration: 0.18 }}
                dir={isHe ? 'rtl' : 'ltr'}
                style={{
                  position: 'fixed',
                  top: pos.flip ? undefined : pos.top,
                  bottom: pos.flip ? window.innerHeight - pos.top + 10 : undefined,
                  left: Math.max(8, Math.min(pos.left, window.innerWidth - 316)),
                  zIndex: 8002,
                  width: 'min(308px, calc(100vw - 32px))',
                  background: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 12px 40px rgba(26,25,24,0.22)',
                  padding: '16px 18px',
                  border: '1px solid #E0D9CE',
                }}
              >
                {/* Header row: type label + exit button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {steps.map((_, i) => (
                      <div key={i} style={{ height: 4, width: i === step ? 20 : 8, borderRadius: 9999, background: i <= step ? '#14422d' : '#E0D9CE', transition: 'all 0.2s' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      onClick={() => { setShowMenu(true); setVisible(false); }}
                      style={{ background: '#F0EBE3', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#6B6560', padding: '3px 8px', cursor: 'pointer' }}
                      title={isHe ? 'בחר סיור אחר' : 'Switch tour'}
                    >
                      ☰
                    </button>
                    <button
                      onClick={finish}
                      style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#A09893', padding: 0, lineHeight: 1 }}
                      title={isHe ? 'צא מהסיור' : 'Exit tour'}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a1c1b', margin: '0 0 6px' }}>
                  {isHe ? current.titleHe : current.titleEn}
                </h3>
                <p style={{ fontSize: 12, color: 'rgba(26,25,24,0.6)', margin: '0 0 14px', lineHeight: 1.65 }}>
                  {isHe ? current.bodyHe : current.bodyEn}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#A09893' }}>{step + 1} / {steps.length}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {step > 0 && (
                      <button onClick={goPrev} style={{ padding: '7px 14px', borderRadius: 9999, background: '#F0EBE3', border: 'none', fontSize: 12, fontWeight: 600, color: '#6B6560', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {isHe ? <ChevronRight size={14} strokeWidth={2} /> : <ChevronLeft size={14} strokeWidth={2} />}
                      </button>
                    )}
                    <button onClick={goNext} style={{ padding: '7px 18px', borderRadius: 9999, background: '#14422d', border: 'none', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                      {step < steps.length - 1 ? (isHe ? 'הבא' : 'Next') : (isHe ? 'סיום' : 'Done')}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
