'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useMealPlan } from '@/context/MealPlanContext';
import { recipes } from '@/data/recipes';
import { Recipe, PrepStep, ShoppingCategory } from '@/types';
import { calculateShoppingList, mergeShoppingLists, groupByCategory, SHOPPING_CATEGORY_ORDER } from '@/lib/shoppingList';

const CATEGORY_EMOJI: Record<string, string> = {
  fish: '🐟', chicken: '🍗', turkey: '🦃', tofu: '🟡',
  breakfast: '🌅', beef: '🥩', salad: '🥗', side: '🍚',
};

const SHOPPING_ICON: Record<ShoppingCategory, string> = {
  protein: '🥩', vegetables: '🥦', dairy: '🥛',
  grains: '🌾', spices: '🧂', other: '🛒',
};

type Step = 1 | 2 | 3;
type GuidePhase = 'setup' | 'prep' | 'cook' | 'pack';

interface GuideStep {
  id: number;
  phase: GuidePhase;
  titleHe: string;
  bodyHe: string;
  timerMinutes?: number;
  involvedRecipes: string[];
  parallel?: string; // note about what else to do
}

type TimerStatus = 'idle' | 'running' | 'paused' | 'done';
interface TimerState { status: TimerStatus; remaining: number; }

// ─── Guide generator ───────────────────────────────────────────────────────────

function generateGuide(selected: Recipe[], servesMap: Record<string, number>): GuideStep[] {
  if (selected.length === 0) return [];

  const steps: GuideStep[] = [];
  let id = 0;
  const push = (s: Omit<GuideStep, 'id'>) => steps.push({ ...s, id: ++id });

  // Sort longest cook time first (start those first)
  const byTime = [...selected].sort((a, b) => b.cookTimeMin - a.cookTimeMin);

  const needsOven  = (r: Recipe) => r.steps.some(s => s.he.includes('תנור'));
  const needsStove = (r: Recipe) => r.steps.some(s => s.he.includes('סיר') || s.he.includes('מחבת') || s.he.includes('מטגנ'));

  const ovenRecipes  = byTime.filter(needsOven);
  const stoveRecipes = byTime.filter(needsStove);

  // ── 1. SETUP ──
  const equipment: string[] = ['קרש חיתוך וסכין', 'קופסאות שמירה'];
  if (ovenRecipes.length)  equipment.push('תבנית אפייה + נייר אפייה');
  if (stoveRecipes.length) equipment.push('סיר רחב / מחבת גדולה');

  push({
    phase: 'setup',
    titleHe: 'הכנת המטבח',
    bodyHe: `לפני שמתחילים — הוציאו את כל הציוד הדרוש:\n${equipment.map(e => `• ${e}`).join('\n')}\n\nמדדו ומשקלו תבלינים עבור כל המתכונים מראש לחסכון בזמן.`,
    involvedRecipes: selected.map(r => r.nameHe),
  });

  // ── 2. PREHEAT (if oven needed) ──
  if (ovenRecipes.length > 0) {
    const temps = ovenRecipes.flatMap(r =>
      r.steps
        .filter(s => s.he.includes('תנור') || s.he.includes('מחממ'))
        .map(s => { const m = s.he.match(/(\d{3})/); return m ? parseInt(m[1]) : null; })
        .filter((t): t is number => t !== null)
    );
    const maxTemp = temps.length ? Math.max(...temps) : 220;
    const withFan = ovenRecipes.some(r => r.steps.some(s => s.he.includes('טורבו') || s.he.includes('פן')));

    push({
      phase: 'setup',
      titleHe: 'חימום תנור',
      bodyHe: `מחממים את התנור ל-${maxTemp} מעלות${withFan ? ' עם טורבו' : ''}.\n\nבזמן ההמתנה — עברו לשלב ההכנה.`,
      timerMinutes: 10,
      involvedRecipes: ovenRecipes.map(r => r.nameHe),
    });
  }

  // ── 3. PREP — all non-timed, non-preheat, non-pack steps, grouped by recipe ──
  const prepParts: string[] = [];
  const prepRecipes: string[] = [];

  for (const recipe of byTime) {
    const prepSteps = recipe.steps.filter(s => {
      if (s.timerMinutes) return false;
      if (s.he.includes('מחממ') || s.he.includes('תנור')) return false;
      if (s.he.includes('מצנן') || s.he.includes('קופסא')) return false;
      return true;
    });
    if (prepSteps.length > 0) {
      prepParts.push(`**${recipe.nameHe}:**`);
      prepSteps.forEach(s => prepParts.push(`• ${s.he}`));
      prepRecipes.push(recipe.nameHe);
    }
  }

  if (prepParts.length > 0) {
    push({
      phase: 'prep',
      titleHe: selected.length > 1 ? 'הכנה מוקדמת — כל המנות' : 'הכנה מוקדמת',
      bodyHe: prepParts.join('\n'),
      involvedRecipes: prepRecipes,
    });
  }

  // ── 4. MARINATE steps (timed passive waits) ──
  for (const recipe of byTime) {
    const marinateStep = recipe.steps.find(s =>
      s.timerMinutes &&
      s.timerMinutes >= 10 &&
      (s.he.includes('השרי') || s.he.includes('מרינד') || s.he.includes('להשרות'))
    );
    if (marinateStep) {
      const others = byTime.filter(r => r.id !== recipe.id);
      let body = marinateStep.he;
      if (others.length > 0) {
        body += `\n\n↳ **בזמן ההמתנה** — התחילו להכין את: ${others.map(r => r.nameHe).join(', ')}.`;
      }
      push({
        phase: 'prep',
        titleHe: `השרייה — ${recipe.nameHe}`,
        bodyHe: body,
        timerMinutes: marinateStep.timerMinutes,
        involvedRecipes: [recipe.nameHe],
      });
    }
  }

  // ── 5. COOK ──
  // Collect all timed cooking steps (not preheat, not marinate, not pack)
  type CookTask = { recipe: Recipe; step: PrepStep; isOven: boolean };

  const cookTasks: CookTask[] = [];
  for (const recipe of byTime) {
    for (const step of recipe.steps) {
      if (!step.timerMinutes) continue;
      if (step.he.includes('מחממ')) continue;                      // preheat
      if (step.he.includes('השרי') || step.he.includes('להשרות')) continue; // marinate
      if (step.he.includes('מצנן') || step.he.includes('קופסא')) continue;  // pack
      const isOven = step.he.includes('אופ') || step.he.includes('צולה') || step.he.includes('צולי') ||
                     (step.he.includes('תנור') && !step.he.includes('מחממ'));
      cookTasks.push({ recipe, step, isOven });
    }
  }

  const ovenTasks  = cookTasks.filter(t => t.isOven);
  const stoveTasks = cookTasks.filter(t => !t.isOven);

  // Oven steps first, with parallel notes
  const usedParallel = new Set<string>();
  for (const task of ovenTasks) {
    const parallelStove = stoveTasks.find(st =>
      !usedParallel.has(st.recipe.id) &&
      st.recipe.id !== task.recipe.id &&
      (st.step.timerMinutes ?? 0) <= (task.step.timerMinutes ?? 0) + 8
    );

    let body = task.step.he;
    if (parallelStove) {
      usedParallel.add(parallelStove.recipe.id);
      body += `\n\n↳ **בזמן האפייה** — עברו להכין את ${parallelStove.recipe.nameHe} על הגז (שלב הבא).`;
    } else if (stoveTasks.length > 0 && !usedParallel.size) {
      body += `\n\n↳ **בזמן האפייה** — עברו להכין את ה${stoveTasks[0].recipe.nameHe} על הגז.`;
    }

    push({
      phase: 'cook',
      titleHe: `בתנור — ${task.recipe.nameHe}`,
      bodyHe: body,
      timerMinutes: task.step.timerMinutes,
      involvedRecipes: [task.recipe.nameHe],
    });
  }

  // Stove steps
  for (const task of stoveTasks) {
    push({
      phase: 'cook',
      titleHe: `על הגז — ${task.recipe.nameHe}`,
      bodyHe: task.step.he,
      timerMinutes: task.step.timerMinutes,
      involvedRecipes: [task.recipe.nameHe],
    });
  }

  // If there are cook tasks but none were oven/stove (e.g., simple tasks), add them
  if (cookTasks.length === 0) {
    // Fallback: collect any remaining timed steps
    for (const recipe of byTime) {
      const ts = recipe.steps.filter(s => s.timerMinutes && !s.he.includes('מצנן') && !s.he.includes('קופסא'));
      for (const s of ts) {
        push({
          phase: 'cook',
          titleHe: recipe.nameHe,
          bodyHe: s.he,
          timerMinutes: s.timerMinutes,
          involvedRecipes: [recipe.nameHe],
        });
      }
    }
  }

  // ── 6. PACK ──
  const storageNotes = selected.map(r => `• ${r.nameHe}: עד ${r.storageDays} ימים במקרר`).join('\n');
  push({
    phase: 'pack',
    titleHe: 'צינון ואריזה',
    bodyHe: `מניחים לכל המנות להתקרר כ-15 דקות לפני האריזה בקופסאות.\n\n${storageNotes}\n\nניתן להקפיא לעד חודש.`,
    timerMinutes: 15,
    involvedRecipes: selected.map(r => r.nameHe),
  });

  return steps;
}

// ─── Phase config ──────────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<GuidePhase, { label: string; color: string; bg: string }> = {
  setup: { label: 'הכנה',   color: '#6B6560', bg: '#F0EBE3' },
  prep:  { label: 'הכנה מוקדמת', color: '#2A4F3A', bg: '#EBF2ED' },
  cook:  { label: 'בישול',  color: '#C9572A', bg: '#FBF0EB' },
  pack:  { label: 'אריזה',  color: '#1A1918', bg: '#F0EBE3' },
};

// ─── Timer component ───────────────────────────────────────────────────────────

function StepTimer({ minutes, stepId }: { minutes: number; stepId: number }) {
  const [state, setState] = useState<TimerState>({ status: 'idle', remaining: minutes * 60 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => { if (intervalRef.current) clearInterval(intervalRef.current); };

  const start = useCallback(() => {
    clear();
    setState(prev => ({ ...prev, status: 'running' }));
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.remaining <= 1) {
          clear();
          return { status: 'done', remaining: 0 };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
  }, []);

  const pause = useCallback(() => {
    clear();
    setState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const reset = useCallback(() => {
    clear();
    setState({ status: 'idle', remaining: minutes * 60 });
  }, [minutes]);

  useEffect(() => () => clear(), []);

  const { status, remaining } = state;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progress = 1 - remaining / (minutes * 60);

  if (status === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#2A4F3A' }}>✓ הסתיים!</span>
        <button onClick={reset} style={{ fontSize: 11, color: 'rgba(26,25,24,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
          אפס
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
      {/* Radial progress ring */}
      <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="20" cy="20" r="16" fill="none" stroke="#E0D9CE" strokeWidth="3" />
          <circle
            cx="20" cy="20" r="16"
            fill="none"
            stroke={status === 'running' ? '#C9572A' : '#2A4F3A'}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 16}`}
            strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, color: '#1A1918',
        }}>
          {mins}:{String(secs).padStart(2, '0')}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {status === 'idle' && (
          <button
            onClick={start}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 9999,
              background: '#1A1918', color: '#F7F3EE',
              fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            ▶ התחל טיימר — {minutes} דק׳
          </button>
        )}
        {status === 'running' && (
          <>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#C9572A', minWidth: 42 }}>{display}</span>
            <button onClick={pause} style={smallBtnStyle}>⏸ השהה</button>
            <button onClick={reset} style={{ ...smallBtnStyle, color: 'rgba(26,25,24,0.35)' }}>↺</button>
          </>
        )}
        {status === 'paused' && (
          <>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6560', minWidth: 42 }}>{display}</span>
            <button onClick={start} style={smallBtnStyle}>▶ המשך</button>
            <button onClick={reset} style={{ ...smallBtnStyle, color: 'rgba(26,25,24,0.35)' }}>↺</button>
          </>
        )}
      </div>
    </div>
  );
}

const smallBtnStyle: React.CSSProperties = {
  padding: '5px 11px', borderRadius: 9999,
  background: '#F0EBE3', border: 'none',
  fontSize: 12, fontWeight: 600, color: '#1A1918', cursor: 'pointer',
};

// ─── Body renderer (supports **bold** and \n) ──────────────────────────────────

function StepBody({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 13, color: '#6B6560', lineHeight: 1.65 }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={i}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j} style={{ color: '#1A1918', fontWeight: 600 }}>{p.slice(2, -2)}</strong>
                : p
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step card ─────────────────────────────────────────────────────────────────

function StepCard({ step, index }: { step: GuideStep; index: number }) {
  const cfg = PHASE_CONFIG[step.phase];

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E0D9CE',
      borderRadius: 16,
      padding: '18px 20px',
      display: 'flex',
      gap: 16,
    }}>
      {/* Step number */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: '#1A1918', color: '#F7F3EE',
        fontSize: 13, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        {index + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Phase badge + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            padding: '2px 8px', borderRadius: 9999,
            background: cfg.bg, color: cfg.color,
          }}>
            {cfg.label.toUpperCase()}
          </span>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1918', margin: 0 }}>
            {step.titleHe}
          </h3>
        </div>

        <StepBody text={step.bodyHe} />

        {/* Timer */}
        {step.timerMinutes && (
          <StepTimer minutes={step.timerMinutes} stepId={step.id} />
        )}

        {/* Involved recipes chips */}
        {step.involvedRecipes.length > 0 && step.involvedRecipes.length < 4 && (
          <div style={{ display: 'flex', gap: 5, marginTop: 12, flexWrap: 'wrap' }}>
            {step.involvedRecipes.map(name => (
              <span key={name} style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 9999,
                background: '#F7F3EE', border: '1px solid #E0D9CE',
                color: '#6B6560',
              }}>
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MealPrepWizardPage() {
  const { locale, t } = useLanguage();
  const { selectedIds, selectedRecipes, toggleRecipe, adjustPortion, getPortion } = useMealPlan();

  const [step, setStep] = useState<Step>(selectedIds.size > 0 ? 2 : 1);
  const [guideSteps, setGuideSteps] = useState<GuideStep[]>([]);

  const mergedList = mergeShoppingLists(
    selectedRecipes.map((r) => calculateShoppingList(r, getPortion(r)))
  );
  const grouped = groupByCategory(mergedList);

  const handleGenerate = () => {
    const servesMap: Record<string, number> = {};
    for (const r of selectedRecipes) servesMap[r.id] = getPortion(r);
    setGuideSteps(generateGuide(selectedRecipes, servesMap));
    setStep(3);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Title + step indicator */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold" style={{ color: '#1A1918' }}>
          {t('wizard.title')}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-4">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                style={step >= s ? { background: '#2A4F3A', color: '#fff' } : { background: '#EDE7DC', color: '#A09893' }}
              >
                {s}
              </div>
              {s < 3 && <div className="w-8 h-0.5" style={{ background: step > s ? '#2A4F3A' : '#E0D9CE' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Select recipes ── */}
      {step === 1 && (
        <div>
          <p className="text-sm mb-5 text-center" style={{ color: '#6B6560' }}>{t('wizard.step1.subtitle')}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recipes.map((recipe) => {
              const isSelected = selectedIds.has(recipe.id);
              const name = locale === 'he' ? recipe.nameHe : recipe.nameEn;
              return (
                <button
                  key={recipe.id}
                  onClick={() => toggleRecipe(recipe.id)}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 text-start transition-all"
                  style={isSelected ? { borderColor: '#2A4F3A', background: '#EBF2ED' } : { borderColor: '#E0D9CE', background: '#fff' }}
                >
                  <span className="text-2xl">{CATEGORY_EMOJI[recipe.category] ?? '🍽'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: '#1A1918' }}>{name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#A09893' }}>{recipe.category}</p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={isSelected ? { background: '#2A4F3A', borderColor: '#2A4F3A' } : { borderColor: '#E0D9CE' }}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={selectedIds.size === 0}
              className="px-6 py-2.5 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ background: '#2A4F3A' }}
            >
              {t('wizard.step1.continue')} →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Portions + shopping list ── */}
      {step === 2 && (
        <div>
          <p className="text-sm mb-5 text-center" style={{ color: '#6B6560' }}>{t('wizard.step2.subtitle')}</p>

          <div className="space-y-3 mb-8">
            {selectedRecipes.map((recipe) => {
              const name = locale === 'he' ? recipe.nameHe : recipe.nameEn;
              const p = getPortion(recipe);
              return (
                <div
                  key={recipe.id}
                  className="flex items-center justify-between p-4 rounded-xl border"
                  style={{ borderColor: '#E0D9CE', background: '#fff' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{CATEGORY_EMOJI[recipe.category] ?? '🍽'}</span>
                    <p className="font-medium text-sm" style={{ color: '#1A1918' }}>{name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustPortion(recipe.id, -1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center font-bold"
                      style={{ borderColor: '#E0D9CE', color: '#6B6560' }}
                    >−</button>
                    <span className="w-10 text-center font-semibold" style={{ color: '#1A1918' }}>{p}</span>
                    <button
                      onClick={() => adjustPortion(recipe.id, 1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center font-bold"
                      style={{ borderColor: '#E0D9CE', color: '#6B6560' }}
                    >+</button>
                    <span className="text-xs ms-1" style={{ color: '#A09893' }}>{t('recipe.servings')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shopping list preview */}
          <div className="rounded-2xl border mb-6 overflow-hidden" style={{ borderColor: '#E0D9CE', background: '#fff' }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#E0D9CE' }}>
              <h3 className="font-bold text-sm" style={{ color: '#1A1918' }}>{t('wizard.step3.shoppingTitle')}</h3>
              <button
                onClick={() => window.print()}
                className="text-xs font-medium border rounded-lg px-3 py-1 print:hidden"
                style={{ color: '#6B6560', borderColor: '#E0D9CE' }}
              >
                🖨 {t('wizard.step3.print')}
              </button>
            </div>
            <div className="px-5 py-4">
              {SHOPPING_CATEGORY_ORDER.filter(cat => grouped[cat]?.length > 0).map(cat => (
                <div key={cat} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm">{SHOPPING_ICON[cat]}</span>
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#A09893' }}>
                      {t(`shopping.category.${cat}`)}
                    </h4>
                  </div>
                  <ul className="space-y-1">
                    {grouped[cat].map((item, i) => {
                      const name = locale === 'he' ? item.nameHe : item.nameEn;
                      const unitLabel = item.unit !== 'unit' && item.unit !== 'to_taste' ? t(`unit.${item.unit}`) : '';
                      return (
                        <li key={i} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: '#F0EBE2' }}>
                          <span className="text-sm" style={{ color: item.optional ? '#A09893' : '#1A1918' }}>
                            {name}
                            {item.optional && <span className="ms-1 text-xs opacity-50">({t('recipe.optional')})</span>}
                          </span>
                          <span className="text-sm font-semibold ms-4 flex-shrink-0" style={{ color: '#2A4F3A' }}>
                            {item.quantity > 0 && item.unit !== 'to_taste'
                              ? `${item.quantity}${unitLabel ? ' ' + unitLabel : ''}`
                              : t('unit.to_taste')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border"
              style={{ color: '#6B6560', borderColor: '#E0D9CE' }}
            >
              ← {t('wizard.step2.back')}
            </button>
            <button
              onClick={handleGenerate}
              className="px-6 py-2.5 text-white font-semibold rounded-xl"
              style={{ background: '#2A4F3A' }}
            >
              {t('wizard.step2.generate')}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Cooking guide with timers ── */}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 className="text-lg font-bold" style={{ color: '#1A1918', margin: 0 }}>
              {t('wizard.step3.guideTitle')}
            </h2>
            <span style={{ fontSize: 12, color: 'rgba(26,25,24,0.4)' }}>
              {guideSteps.length} שלבים
            </span>
          </div>

          {/* Phase legend */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {(Object.entries(PHASE_CONFIG) as [GuidePhase, typeof PHASE_CONFIG[GuidePhase]][]).map(([phase, cfg]) => (
              <span key={phase} style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                padding: '3px 10px', borderRadius: 9999,
                background: cfg.bg, color: cfg.color,
              }}>
                {cfg.label.toUpperCase()}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {guideSteps.map((s, i) => (
              <StepCard key={s.id} step={s} index={i} />
            ))}
          </div>

          <div className="mt-8 flex justify-between print:hidden">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border"
              style={{ color: '#6B6560', borderColor: '#E0D9CE' }}
            >
              ← {t('wizard.step3.back')}
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border"
              style={{ color: '#6B6560', borderColor: '#E0D9CE' }}
            >
              🖨 {t('wizard.step3.print')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
