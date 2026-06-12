'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

/* ─── Types ─────────────────────────────────────────────── */
type GoalType = 'save-money' | 'eat-healthy' | 'save-time' | 'all';
type HouseholdSize = 1 | 2 | 4 | 5;
type MonthlyBudget = 'under-500' | '500-1000' | '1000-1500' | 'over-1500';
type PrepFrequency = 'never' | '1-2' | '3-5' | 'always';

export interface UserProfile {
  goal: GoalType;
  householdSize: HouseholdSize;
  monthlyBudget: MonthlyBudget;
  prepFrequency: PrepFrequency;
  dietaryPrefs: string[];
  estimatedSavings: number;
  completedAt: string;
}

/* ─── Constants ─────────────────────────────────────────── */
const SAVINGS_MAP: Record<MonthlyBudget, number> = {
  'under-500':  80,
  '500-1000':   200,
  '1000-1500':  320,
  'over-1500':  450,
};

const RECIPES_MAP: Record<HouseholdSize, number> = { 1: 12, 2: 18, 4: 24, 5: 30 };
const HOURS_MAP: Record<PrepFrequency, number> = { 'never': 2, '1-2': 1.5, '3-5': 1, 'always': 0.5 };

const TOTAL_STEPS = 5;

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 };

/* ─── Option Button ─────────────────────────────────────── */
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

/* ─── Progress Dots ─────────────────────────────────────── */
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 8,
            borderRadius: 9999,
            background: i === current ? '#14422d' : '#e0d9ce',
            width: i === current ? 24 : 8,
            transition: 'all 0.3s ease',
          }}
        />
      ))}
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
  const [householdSize, setHouseholdSize] = useState<HouseholdSize | null>(null);
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null);
  const [prepFrequency, setPrepFrequency] = useState<PrepFrequency | null>(null);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);

  function goNext() {
    setDirection(1);
    setStep(s => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep(s => s - 1);
  }

  function toggleDiet(val: string) {
    setDietaryPrefs(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  const canProceed = [
    !!goal,
    !!householdSize,
    !!monthlyBudget,
    !!prepFrequency,
    true, // dietary prefs optional
  ][step];

  async function handleFinish() {
    const profile: UserProfile = {
      goal: goal!,
      householdSize: householdSize!,
      monthlyBudget: monthlyBudget!,
      prepFrequency: prepFrequency!,
      dietaryPrefs,
      estimatedSavings: SAVINGS_MAP[monthlyBudget!],
      completedAt: new Date().toISOString(),
    };

    // 1. Save to localStorage (always)
    try {
      localStorage.setItem('easyprep_profile', JSON.stringify(profile));
    } catch { /* ignore */ }

    // 2. Save to Clerk unsafeMetadata (if signed in)
    try {
      await user?.update({ unsafeMetadata: { profile } });
    } catch { /* ignore */ }

    // 3. Set cookie + redirect
    document.cookie = 'onboarding_done=1; path=/; max-age=31536000';
    router.push('/dashboard');
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
  };

  /* ── Wow moment screen (after step 4) ── */
  const isWow = step === TOTAL_STEPS;
  const savings = SAVINGS_MAP[monthlyBudget ?? 'under-500'];
  const matchedRecipes = RECIPES_MAP[householdSize ?? 1];
  const prepHours = HOURS_MAP[prepFrequency ?? 'never'];

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#faf9f7', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px', width: '100%', flex: 1 }}>

        {/* Skip button */}
        {!isWow && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 32 }}>
            <button
              onClick={() => {
                document.cookie = 'onboarding_done=1; path=/; max-age=31536000';
                router.push('/dashboard');
              }}
              style={{
                fontSize: 13, color: '#717973', background: 'none', border: 'none',
                cursor: 'pointer', padding: 0, fontWeight: 500,
              }}
            >
              דלג ←
            </button>
          </div>
        )}

        {/* Progress dots */}
        {!isWow && <ProgressDots current={step} total={TOTAL_STEPS} />}

        {/* Animated step content */}
        <AnimatePresence mode="wait" custom={direction}>
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
                  מה המטרה שלך?
                </h2>
                <p style={{ fontSize: 14, color: '#717973', marginBottom: 28 }}>בחר את מה שהכי חשוב לך</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([
                    { id: 'save-money',   icon: '💰', label: 'לחסוך כסף' },
                    { id: 'eat-healthy',  icon: '🥗', label: 'לאכול בריא' },
                    { id: 'save-time',    icon: '⏱', label: 'לחסוך זמן' },
                    { id: 'all',          icon: '✨', label: 'הכל יחד' },
                  ] as { id: GoalType; icon: string; label: string }[]).map(opt => (
                    <OptionButton key={opt.id} selected={goal === opt.id} onClick={() => setGoal(opt.id)}>
                      <span style={{ fontSize: 20 }}>{opt.icon}</span>
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 1: Household size ── */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: '#14422d', marginBottom: 8 }}>
                  בשביל כמה אנשים אתה מבשל?
                </h2>
                <p style={{ fontSize: 14, color: '#717973', marginBottom: 28 }}>נתאים את הכמויות בהתאם</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([
                    { id: 1,  icon: '👤', label: 'רק אני' },
                    { id: 2,  icon: '👫', label: '2 אנשים' },
                    { id: 4,  icon: '👨‍👩‍👧', label: '3-4 אנשים' },
                    { id: 5,  icon: '👨‍👩‍👧‍👦', label: '5 ומעלה' },
                  ] as { id: HouseholdSize; icon: string; label: string }[]).map(opt => (
                    <OptionButton key={opt.id} selected={householdSize === opt.id} onClick={() => setHouseholdSize(opt.id)}>
                      <span style={{ fontSize: 20 }}>{opt.icon}</span>
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2: Monthly budget ── */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: '#14422d', marginBottom: 8 }}>
                  כמה אתה מוציא על קניות בחודש?
                </h2>
                <p style={{ fontSize: 14, color: '#717973', marginBottom: 28 }}>נחשב כמה תחסוך</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([
                    { id: 'under-500',  label: 'עד ₪500' },
                    { id: '500-1000',   label: '₪500 – ₪1,000' },
                    { id: '1000-1500',  label: '₪1,000 – ₪1,500' },
                    { id: 'over-1500',  label: 'מעל ₪1,500' },
                  ] as { id: MonthlyBudget; label: string }[]).map(opt => (
                    <OptionButton key={opt.id} selected={monthlyBudget === opt.id} onClick={() => setMonthlyBudget(opt.id)}>
                      <span style={{ fontSize: 20 }}>💳</span>
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 3: Prep frequency ── */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: '#14422d', marginBottom: 8 }}>
                  כמה ארוחות אתה מכין מראש בשבוע?
                </h2>
                <p style={{ fontSize: 14, color: '#717973', marginBottom: 28 }}>כנה איתנו :)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([
                    { id: 'never',  label: '0 — מאלתר כל יום' },
                    { id: '1-2',    label: '1-2 ארוחות' },
                    { id: '3-5',    label: '3-5 ארוחות' },
                    { id: 'always', label: 'כמעט הכל מראש' },
                  ] as { id: PrepFrequency; label: string }[]).map(opt => (
                    <OptionButton key={opt.id} selected={prepFrequency === opt.id} onClick={() => setPrepFrequency(opt.id)}>
                      <span style={{ fontSize: 20 }}>🍱</span>
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 4: Dietary prefs ── */}
            {step === 4 && (
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: '#14422d', marginBottom: 8 }}>
                  העדפות תזונה
                </h2>
                <p style={{ fontSize: 14, color: '#717973', marginBottom: 28 }}>בחר הכל שרלוונטי (אופציונלי)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([
                    { id: 'none',        label: 'ללא מגבלות' },
                    { id: 'vegetarian',  label: 'צמחוני / טבעוני' },
                    { id: 'gluten-free', label: 'ללא גלוטן' },
                    { id: 'dairy-free',  label: 'ללא חלב' },
                  ]).map(opt => (
                    <OptionButton
                      key={opt.id}
                      selected={dietaryPrefs.includes(opt.id)}
                      onClick={() => toggleDiet(opt.id)}
                    >
                      <span style={{ fontSize: 20 }}>🌿</span>
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}

            {/* ── Wow moment ── */}
            {isWow && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#14422d', marginBottom: 8 }}>
                  Easy PREP בנוי בשבילך
                </h2>
                <p style={{ fontSize: 15, color: '#717973', marginBottom: 36 }}>
                  על סמך הנתונים שלך, הנה מה שמחכה לך:
                </p>

                {/* Value cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                  {[
                    { icon: '💰', label: 'חיסכון משוער',   value: `₪${savings}`,            sub: 'לחודש' },
                    { icon: '📖', label: 'מתכונים מתאימים', value: `${matchedRecipes}`,        sub: 'מתכונים' },
                    { icon: '⏱', label: 'זמן בישול',       value: `~${prepHours} שעות`,      sub: 'בשבוע' },
                  ].map(card => (
                    <div
                      key={card.label}
                      style={{
                        background: '#ffffff',
                        borderRadius: 20,
                        padding: '20px 24px',
                        boxShadow: '0 8px 32px rgba(45,90,67,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        textAlign: 'right',
                      }}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'rgba(20,66,45,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                      }}>
                        {card.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#717973', marginBottom: 2 }}>{card.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#14422d', lineHeight: 1 }}>
                          {card.value}
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#717973', marginRight: 6 }}>
                            {card.sub}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleFinish}
                  style={{
                    width: '100%', padding: '16px 0', borderRadius: 16,
                    background: '#14422d', color: '#ffffff',
                    fontSize: 16, fontWeight: 700, border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  בואו נתחיל ←
                </button>
              </div>
            )}

          </motion.div>
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
                  color: '#14422d', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← חזרה
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
              {step === TOTAL_STEPS - 1 ? 'סיים וראה את התוצאות' : 'המשך →'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
