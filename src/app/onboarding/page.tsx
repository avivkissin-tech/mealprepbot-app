'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { pushProfile } from '@/lib/userDataApi';
import { recipes } from '@/data/recipes';

/* ─── Types ─────────────────────────────────────────────── */
type GoalType = 'lose-weight' | 'eat-healthy' | 'order-less' | 'save-time' | 'variety';
type CurrentState = 'improvise' | 'sometimes' | 'usually' | 'advanced';
type OrderFrequency = 'never' | '1' | '2-3' | '4+';
type OrderCost = 'under-50' | '50-80' | '80-120' | 'over-120';
type PrepFrequency = 'never' | '1-2' | '3-5' | 'always';

export interface UserProfile {
  goal: GoalType;
  currentState: CurrentState;
  dietaryPrefs: string[];
  orderFrequency?: OrderFrequency;
  orderCost?: OrderCost;
  prepFrequency: PrepFrequency;
  estimatedSavings: number;
  completedAt: string;
}

/* ─── Helpers ───────────────────────────────────────────── */
const COST_MAP: Record<OrderCost, number> = {
  'under-50': 35,
  '50-80': 65,
  '80-120': 100,
  'over-120': 140,
};
const FREQ_MAP: Record<Exclude<OrderFrequency, 'never'>, number> = {
  '1': 4,
  '2-3': 10,
  '4+': 16,
};
const STATE_TO_PREP: Record<CurrentState, PrepFrequency> = {
  improvise: 'never',
  sometimes: '1-2',
  usually: '3-5',
  advanced: 'always',
};

function countMatchingRecipes(prefs: string[]): number {
  if (!prefs.length || prefs.includes('none')) return recipes.length;
  return recipes.filter(r => {
    const allTags = [...(r.tags ?? []), ...(r.dietaryTags ?? [])];
    if (prefs.includes('vegan') && !allTags.includes('vegan')) return false;
    if (prefs.includes('vegetarian') && !allTags.some(t => t === 'vegetarian' || t === 'vegan')) return false;
    if (prefs.includes('gluten-free') && !allTags.includes('gluten-free')) return false;
    if (prefs.includes('dairy-free') && !allTags.includes('dairy-free')) return false;
    return true;
  }).length;
}

const GOAL_LABELS: Record<GoalType, { he: string; en: string }> = {
  'lose-weight': { he: 'לרדת במשקל', en: 'Lose weight' },
  'eat-healthy': { he: 'לאכול בריא', en: 'Eat healthy' },
  'order-less':  { he: 'להזמין פחות אוכל', en: 'Order less food' },
  'save-time':   { he: 'לחסוך זמן', en: 'Save time' },
  'variety':     { he: 'לגוון את התפריט', en: 'Add variety' },
};

const STATE_LABELS: Record<CurrentState, { he: string; en: string }> = {
  improvise: { he: 'מאלתר כל יום', en: 'Improvise daily' },
  sometimes: { he: 'לפעמים מכין מראש', en: 'Sometimes prep ahead' },
  usually:   { he: 'בדרך כלל מתכנן', en: 'Usually plan ahead' },
  advanced:  { he: 'כמעט הכל מראש', en: 'Almost always prep' },
};

const DIET_LABELS: Record<string, { he: string; en: string }> = {
  none:         { he: 'ללא מגבלות', en: 'No restrictions' },
  vegetarian:   { he: 'צמחוני', en: 'Vegetarian' },
  vegan:        { he: 'טבעוני', en: 'Vegan' },
  'gluten-free': { he: 'ללא גלוטן', en: 'Gluten-free' },
  'dairy-free':  { he: 'ללא חלב', en: 'Dairy-free' },
};

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 };

/* ─── OptionButton ──────────────────────────────────────── */
function OptionButton({
  selected, onClick, children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '16px 20px',
        borderRadius: 16,
        border: `2px solid ${selected ? '#14422d' : '#e0d9ce'}`,
        background: selected ? '#14422d' : '#ffffff',
        color: selected ? '#ffffff' : '#1a1c1b',
        fontSize: 15,
        fontWeight: 600,
        textAlign: 'right',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {children}
    </button>
  );
}

/* ─── ProgressBar ───────────────────────────────────────── */
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ height: 4, background: '#e0d9ce', borderRadius: 9999, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${((current + 1) / total) * 100}%`,
            background: '#14422d',
            borderRadius: 9999,
            transition: 'width 0.35s ease',
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: '#A09893', marginTop: 6, textAlign: 'left' }}>
        {current + 1} / {total}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [goal, setGoal] = useState<GoalType | null>(null);
  const [currentState, setCurrentState] = useState<CurrentState | null>(null);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [orderFrequency, setOrderFrequency] = useState<OrderFrequency | null>(null);
  const [orderCost, setOrderCost] = useState<OrderCost | null>(null);
  const [isWow, setIsWow] = useState(false);

  const isOrderLess = goal === 'order-less';
  const totalSteps = isOrderLess ? 4 : 3;

  function goNext() {
    setDirection(1);
    // Handle step 3 sub-steps for order-less
    if (isOrderLess && step === 3) {
      if (orderFrequency === 'never') {
        setIsWow(true);
        return;
      }
      if (orderFrequency && orderCost) {
        setIsWow(true);
        return;
      }
      return; // wait for both selections
    }
    if (step >= totalSteps - 1) {
      setIsWow(true);
    } else {
      setStep(s => s + 1);
    }
  }

  function goBack() {
    if (isWow) {
      setIsWow(false);
      return;
    }
    setDirection(-1);
    setStep(s => s - 1);
  }

  function toggleDiet(val: string) {
    setDietaryPrefs(prev => {
      if (val === 'none') return ['none'];
      const without = prev.filter(v => v !== 'none');
      return without.includes(val) ? without.filter(v => v !== val) : [...without, val];
    });
  }

  const canProceed = (() => {
    if (step === 0) return !!goal;
    if (step === 1) return !!currentState;
    if (step === 2) return true; // dietary optional
    if (step === 3 && isOrderLess) {
      if (!orderFrequency) return false;
      if (orderFrequency === 'never') return true;
      return !!orderCost;
    }
    return true;
  })();

  async function handleFinish() {
    const prepFrequency = STATE_TO_PREP[currentState ?? 'improvise'];
    let estimatedSavings = 0;
    if (isOrderLess && orderFrequency && orderFrequency !== 'never' && orderCost) {
      estimatedSavings = Math.round(COST_MAP[orderCost] * FREQ_MAP[orderFrequency as Exclude<OrderFrequency, 'never'>] * 0.6);
    }

    const profile: UserProfile = {
      goal: goal!,
      currentState: currentState!,
      dietaryPrefs,
      ...(isOrderLess && orderFrequency ? { orderFrequency } : {}),
      ...(isOrderLess && orderFrequency && orderFrequency !== 'never' && orderCost ? { orderCost } : {}),
      prepFrequency,
      estimatedSavings,
      completedAt: new Date().toISOString(),
    };

    try { localStorage.setItem('easyprep_profile', JSON.stringify(profile)); } catch { /* ignore */ }
    try { await user?.update({ unsafeMetadata: { profile } }); } catch { /* ignore */ }
    try { await pushProfile(profile as unknown as Record<string, unknown>); } catch { /* ignore */ }

    document.cookie = 'onboarding_done=1; path=/; max-age=31536000';
    router.push('/dashboard');
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
  };

  /* ── Wow moment values ── */
  const matchedRecipesCount = countMatchingRecipes(dietaryPrefs);
  const showSavings =
    isOrderLess &&
    orderFrequency &&
    orderFrequency !== 'never' &&
    !!orderCost;
  const savingsAmount = showSavings
    ? Math.round(COST_MAP[orderCost!] * FREQ_MAP[orderFrequency as Exclude<OrderFrequency, 'never'>] * 0.6)
    : 0;

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px', width: '100%', flex: 1 }}>

        {/* Skip button */}
        {!isWow && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 32 }}>
            <button
              onClick={() => {
                document.cookie = 'onboarding_done=1; path=/; max-age=31536000';
                router.push('/dashboard');
              }}
              style={{ fontSize: 13, color: '#717973', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}
            >
              דלג
            </button>
          </div>
        )}

        {/* Progress bar */}
        {!isWow && <ProgressBar current={step} total={totalSteps} />}

        {/* Animated step content */}
        <AnimatePresence mode="wait" custom={direction}>
          {!isWow ? (
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springTransition}
            >

              {/* ── Step 0: Goal ── */}
              {step === 0 && (
                <div>
                  <h2 style={{ fontSize: 26, fontWeight: 700, color: '#14422d', marginBottom: 8 }}>
                    מה הדבר שהכי חשוב לכם?
                  </h2>
                  <p style={{ fontSize: 14, color: '#717973', marginBottom: 28 }}>בחרו מטרה אחת</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(Object.entries(GOAL_LABELS) as [GoalType, { he: string }][]).map(([id, label]) => (
                      <OptionButton key={id} selected={goal === id} onClick={() => setGoal(id)}>
                        {label.he}
                      </OptionButton>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 1: Current state ── */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: 26, fontWeight: 700, color: '#14422d', marginBottom: 8 }}>
                    איך נראה השבוע שלכם היום?
                  </h2>
                  <p style={{ fontSize: 14, color: '#717973', marginBottom: 28 }}>היו כנים :)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(Object.entries(STATE_LABELS) as [CurrentState, { he: string }][]).map(([id, label]) => (
                      <OptionButton key={id} selected={currentState === id} onClick={() => setCurrentState(id)}>
                        {label.he}
                      </OptionButton>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Dietary prefs ── */}
              {step === 2 && (
                <div>
                  <h2 style={{ fontSize: 26, fontWeight: 700, color: '#14422d', marginBottom: 8 }}>
                    העדפות תזונה?
                  </h2>
                  <p style={{ fontSize: 14, color: '#717973', marginBottom: 28 }}>בחרו הכל שרלוונטי (אופציונלי)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(Object.entries(DIET_LABELS) as [string, { he: string }][]).map(([id, label]) => (
                      <OptionButton key={id} selected={dietaryPrefs.includes(id)} onClick={() => toggleDiet(id)}>
                        {label.he}
                      </OptionButton>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 3: Order habits (only if order-less) ── */}
              {step === 3 && isOrderLess && (
                <div>
                  <h2 style={{ fontSize: 26, fontWeight: 700, color: '#14422d', marginBottom: 8 }}>
                    הרגלי הזמנה
                  </h2>
                  <p style={{ fontSize: 14, color: '#717973', marginBottom: 20 }}>כמה פעמים מזמינים בשבוע?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                    {([
                      { id: 'never', label: 'כמעט לא מזמין' },
                      { id: '1',    label: 'פעם בשבוע' },
                      { id: '2-3',  label: '2–3 פעמים בשבוע' },
                      { id: '4+',   label: '4 פעמים ומעלה' },
                    ] as { id: OrderFrequency; label: string }[]).map(opt => (
                      <OptionButton key={opt.id} selected={orderFrequency === opt.id} onClick={() => { setOrderFrequency(opt.id); if (opt.id === 'never') setOrderCost(null); }}>
                        {opt.label}
                      </OptionButton>
                    ))}
                  </div>

                  {orderFrequency && orderFrequency !== 'never' && (
                    <>
                      <p style={{ fontSize: 14, color: '#717973', marginBottom: 14 }}>כמה עולה הזמנה בממוצע?</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {([
                          { id: 'under-50', label: 'עד ₪50' },
                          { id: '50-80',    label: '₪50 – ₪80' },
                          { id: '80-120',   label: '₪80 – ₪120' },
                          { id: 'over-120', label: 'מעל ₪120' },
                        ] as { id: OrderCost; label: string }[]).map(opt => (
                          <OptionButton key={opt.id} selected={orderCost === opt.id} onClick={() => setOrderCost(opt.id)}>
                            {opt.label}
                          </OptionButton>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

            </motion.div>
          ) : (
            /* ── Wow moment ── */
            <motion.div
              key="wow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center' }}
            >
              <h2 style={{ fontSize: 28, fontWeight: 700, color: '#14422d', marginBottom: 8 }}>
                הכיוון שלכם מוכן
              </h2>
              <p style={{ fontSize: 14, color: '#717973', marginBottom: 32 }}>
                על סמך הבחירות שלכם — הנה מה שמחכה לכם:
              </p>

              {/* Goal + state summary */}
              <div style={{
                background: '#fff', borderRadius: 20, padding: '20px 24px',
                boxShadow: '0 8px 32px rgba(45,90,67,0.05)', marginBottom: 14, textAlign: 'right',
              }}>
                <div style={{ fontSize: 12, color: '#A09893', marginBottom: 6 }}>המטרה שלכם</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#14422d' }}>
                  {goal ? GOAL_LABELS[goal].he : ''}
                </div>
                {currentState && (
                  <div style={{ fontSize: 13, color: '#717973', marginTop: 4 }}>
                    {STATE_LABELS[currentState].he}
                  </div>
                )}
              </div>

              {/* Dietary prefs pills */}
              {dietaryPrefs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, justifyContent: 'center' }}>
                  {dietaryPrefs.map(p => (
                    <span key={p} style={{
                      fontSize: 12, fontWeight: 600,
                      background: '#EBF2ED', color: '#14422d',
                      borderRadius: 9999, padding: '4px 12px',
                    }}>
                      {DIET_LABELS[p]?.he ?? p}
                    </span>
                  ))}
                </div>
              )}

              {/* Matched recipes count */}
              <div style={{
                background: '#fff', borderRadius: 20, padding: '20px 24px',
                boxShadow: '0 8px 32px rgba(45,90,67,0.05)', marginBottom: 14, textAlign: 'right',
              }}>
                <div style={{ fontSize: 12, color: '#A09893', marginBottom: 4 }}>מתכונים מתאימים עבורכם</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#14422d' }}>
                  {matchedRecipesCount}
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#717973', marginInlineStart: 8 }}>מתכונים</span>
                </div>
              </div>

              {/* Savings card (conditional) */}
              {showSavings && (
                <div style={{
                  background: '#EBF2ED', borderRadius: 20, padding: '20px 24px',
                  marginBottom: 14, textAlign: 'right',
                }}>
                  <div style={{ fontSize: 12, color: '#14422d', marginBottom: 4 }}>חיסכון משוער</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#14422d' }}>
                    ₪{savingsAmount}
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#14422d', marginInlineStart: 8 }}>לחודש</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#14422d', opacity: 0.7, marginTop: 4 }}>הערכה בלבד</div>
                </div>
              )}

              {/* CTAs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
                <button
                  onClick={handleFinish}
                  style={{
                    width: '100%', padding: '16px 0', borderRadius: 16,
                    background: '#14422d', color: '#ffffff',
                    fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
                  }}
                >
                  מצאו לי מתכונים
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {!isWow && (
          <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
            {step > 0 && (
              <button
                onClick={goBack}
                style={{
                  padding: '14px 24px', borderRadius: 16,
                  border: '2px solid #14422d', background: 'transparent',
                  color: '#14422d', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                חזרה
              </button>
            )}
            <button
              onClick={canProceed ? goNext : undefined}
              disabled={!canProceed}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 16,
                background: canProceed ? '#14422d' : '#e0d9ce',
                color: canProceed ? '#ffffff' : '#b0b8b2',
                fontSize: 15, fontWeight: 700, border: 'none',
                cursor: canProceed ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
            >
              {step >= totalSteps - 1 ? 'סיום' : 'המשך'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
