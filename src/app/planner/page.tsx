'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@clerk/nextjs';
import { fetchPlanner, pushPlanner } from '@/lib/userDataApi';
import { recipes } from '@/data/recipes';
import { calculateShoppingList, mergeShoppingLists, groupByCategory, SHOPPING_CATEGORY_ORDER } from '@/lib/shoppingList';
import { ShoppingCategory, Recipe } from '@/types';
import { scheduleMealPrep, estimateTotalMinutes, formatTimerMinutes } from '@/lib/mealPrepScheduler';
import MealPrepSession from '@/components/recipes/MealPrepSession';
import { Beef, Leaf, Droplets, Wheat, Flame, ShoppingBag, ShoppingCart, Utensils } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

const DAYS = ['יום 1', 'יום 2', 'יום 3', 'יום 4', 'יום 5', 'יום 6', 'יום 7'];

function getShoppingIcon(cat: ShoppingCategory) {
  const props = { size: 14, strokeWidth: 1.75 };
  switch (cat) {
    case 'protein':    return <Beef {...props} />;
    case 'vegetables': return <Leaf {...props} />;
    case 'dairy':      return <Droplets {...props} />;
    case 'grains':     return <Wheat {...props} />;
    case 'spices':     return <Flame {...props} />;
    case 'other':      return <ShoppingBag {...props} />;
  }
}

const SHOPPING_LABEL_HE: Record<ShoppingCategory, string> = {
  protein: 'חלבונים', vegetables: 'ירקות', dairy: 'חלב ומוצריו',
  grains: 'דגנים', spices: 'תבלינים', other: 'שונות',
};

export default function PlannerPage() {
  const { locale, t } = useLanguage();
  const isHe = locale === 'he';
  const { isSignedIn, isLoaded } = useAuth();

  const PLAN_KEY   = 'easyprep_planner';
  const PEOPLE_KEY = 'easyprep_planner_people';

  const [plan, setPlan] = useState<Record<number, string[]>>({});
  const [globalPeople, setGlobalPeople] = useState<number>(2);
  // modal
  const [pickingDay, setPickingDay] = useState<number | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  // shopping panel
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingView, setShoppingView] = useState<'general' | 'byRecipe'>('general');
  const [checkedShoppingItems, setCheckedShoppingItems] = useState<Set<string>>(new Set());

  function toggleShoppingItem(key: string) {
    setCheckedShoppingItems(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  // meal prep session — restore from localStorage if session was minimized
  const [showMealPrepModal, setShowMealPrepModal] = useState(false);
  const [prepSelectedIds, setPrepSelectedIds]     = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('easyprep_active_session');
      if (!raw) return new Set();
      const { recipeIds } = JSON.parse(raw);
      return new Set(recipeIds as string[]);
    } catch { return new Set(); }
  });
  const [showMealPrepSession, setShowMealPrepSession] = useState(() => {
    try { return !!localStorage.getItem('easyprep_active_session'); } catch { return false; }
  });

  // Load on mount: localStorage first, then Supabase
  useEffect(() => {
    try {
      setPlan(JSON.parse(localStorage.getItem(PLAN_KEY) ?? '{}'));
      const p = parseInt(localStorage.getItem(PEOPLE_KEY) ?? '2', 10);
      setGlobalPeople(isNaN(p) ? 2 : p);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchPlanner().then(({ plan: p, serves: s }) => {
      if (Object.keys(p).length > 0) {
        setPlan(p as Record<number, string[]>);
        try { localStorage.setItem(PLAN_KEY, JSON.stringify(p)); } catch {}
      }
      // serves stored as { global: N }
      const globalVal = (s as Record<string, number>)?.global;
      if (globalVal) {
        setGlobalPeople(globalVal);
        try { localStorage.setItem(PEOPLE_KEY, String(globalVal)); } catch {}
      }
    }).catch(() => {});
  }, [isSignedIn, isLoaded]);

  // Persist every change
  useEffect(() => {
    try { localStorage.setItem(PLAN_KEY, JSON.stringify(plan)); } catch {}
    try { localStorage.setItem(PEOPLE_KEY, String(globalPeople)); } catch {}
    if (isSignedIn) pushPlanner(plan as Record<string, string[]>, { global: globalPeople }).catch(() => {});
  }, [plan, globalPeople, isSignedIn]);
  // serves changes handled by plan effect above (pushed together)

  const addRecipe = (day: number, recipeId: string) => {
    setPlan(prev => ({ ...prev, [day]: [...(prev[day] ?? []), recipeId] }));
    setPickingDay(null);
    setModalSearch('');
  };

  const removeRecipe = (day: number, slotIdx: number) => {
    setPlan(prev => {
      const current = [...(prev[day] ?? [])];
      current.splice(slotIdx, 1);
      return { ...prev, [day]: current };
    });
  };

  // Aggregate shopping list from all plan slots using global people count
  const shoppingList = useMemo(() => {
    const lists = [];
    for (const recipeIds of Object.values(plan)) {
      for (const recipeId of recipeIds) {
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe) lists.push(calculateShoppingList(recipe, globalPeople));
      }
    }
    return mergeShoppingLists(lists);
  }, [plan, globalPeople]);

  const grouped = groupByCategory(shoppingList);

  // Per-recipe breakdown for "by recipe" view — aggregated across all days
  const perRecipeLists = useMemo(() => {
    const counts = new Map<string, { recipe: typeof recipes[0]; appearances: number }>();
    for (const recipeIds of Object.values(plan)) {
      for (const recipeId of recipeIds) {
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) continue;
        const existing = counts.get(recipe.id);
        if (existing) existing.appearances += 1;
        else counts.set(recipe.id, { recipe, appearances: 1 });
      }
    }
    return Array.from(counts.values()).map(({ recipe, appearances }) => ({
      recipe,
      servings: globalPeople * appearances,
      appearances,
      items: calculateShoppingList(recipe, globalPeople * appearances),
    }));
  }, [plan, globalPeople]);

  const totalRecipes = Object.values(plan).reduce((sum, arr) => sum + arr.length, 0);

  const plannerRecipes = useMemo((): Recipe[] => {
    const seen = new Set<string>();
    const result: Recipe[] = [];
    for (const ids of Object.values(plan)) {
      for (const id of ids) {
        if (!seen.has(id)) {
          seen.add(id);
          const r = recipes.find(rec => rec.id === id);
          if (r) result.push(r);
        }
      }
    }
    return result;
  }, [plan]);

  const estimatedPrepMinutes = useMemo(() => {
    const selected = plannerRecipes.filter(r => prepSelectedIds.has(r.id));
    if (selected.length === 0) return 0;
    return estimateTotalMinutes(scheduleMealPrep(selected));
  }, [prepSelectedIds, plannerRecipes]);

  const filteredForModal = useMemo(() => {
    if (!modalSearch.trim()) return recipes;
    const q = modalSearch.toLowerCase();
    return recipes.filter(r => r.nameHe.includes(q) || r.nameEn.toLowerCase().includes(q));
  }, [modalSearch]);

  const [activeMobileDay, setActiveMobileDay] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input without causing scroll jump
  useEffect(() => {
    if (pickingDay !== null) {
      const t = setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 120);
      return () => clearTimeout(t);
    }
  }, [pickingDay]);

  // TODO(post-launch): replace skeleton with proper loading state if Clerk cold-start is noticeable
  if (!isLoaded) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '24px 24px 80px', maxWidth: 1400, margin: '0 auto' }}>
        <Skeleton height={34} width={180} borderRadius={8} />
        <div style={{ height: 12 }} />
        <Skeleton height={18} width={240} borderRadius={6} />
        <div style={{ height: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(160px, 1fr))', gap: 12, minWidth: 1120 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 16, overflow: 'hidden', height: 280 }}>
              <Skeleton height={280} borderRadius={16} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* ── Header bar ── */}
      <div style={{
        maxWidth: 1400, margin: '0 auto', padding: '24px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 id="tour-planner-title" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>הפלאנר שלי</h1>
          <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.5)', marginTop: 2 }}>
            {totalRecipes > 0 ? `${totalRecipes} ארוחות מתוכננות השבוע` : 'לחץ + להוסיף ארוחה לכל יום'}
          </p>
        </div>
        {/* People selector — visible on all sizes */}
        <div id="tour-planner-people" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 9999, padding: '8px 14px',
        }}>
          <span className="hidden md:inline" style={{ fontSize: 13, color: 'rgba(26,25,24,0.6)', whiteSpace: 'nowrap' }}>מכין עבור</span>
          <button onClick={() => setGlobalPeople(p => Math.max(1, p - 1))} style={{ ...serveBtnStyle, width: 24, height: 24 }}>−</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', minWidth: 16, textAlign: 'center' }}>{globalPeople}</span>
          <button onClick={() => setGlobalPeople(p => Math.min(20, p + 1))} style={{ ...serveBtnStyle, width: 24, height: 24 }}>+</button>
          <span style={{ fontSize: 13, color: 'rgba(26,25,24,0.6)' }}>אנשים</span>
        </div>

        {/* Action buttons — desktop only (mobile gets sticky bottom bar) */}
        <div className="hidden md:flex" style={{ gap: 8 }}>
          {totalRecipes > 0 && (
            <button
              onClick={() => { setPrepSelectedIds(new Set(plannerRecipes.map(r => r.id))); setShowMealPrepModal(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 9999,
                background: '#14422d', color: '#faf9f7',
                fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}
            >
              <Utensils size={14} strokeWidth={1.75} /> התחל מילפרפ
            </button>
          )}
          <button
            id="tour-planner-shopping"
            onClick={() => setShowShopping(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 9999,
              background: '#1a1c1b', color: '#faf9f7',
              fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12h6M9 16h4"/>
            </svg>
            רשימת קניות
            {shoppingList.length > 0 && (
              <span style={{ background: '#C9572A', color: '#fff', borderRadius: 9999, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                {shoppingList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ── */}
      <div className="md:hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
        padding: '10px 16px 18px',
        display: 'flex', gap: 10,
      }}>
        {totalRecipes > 0 && (
          <button
            onClick={() => { setPrepSelectedIds(new Set(plannerRecipes.map(r => r.id))); setShowMealPrepModal(true); }}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '12px', borderRadius: 14,
              background: '#14422d', color: '#faf9f7',
              fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            🍳 התחל מילפרפ
          </button>
        )}
        <button
          onClick={() => setShowShopping(true)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px', borderRadius: 14,
            background: '#1a1c1b', color: '#faf9f7',
            fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 12h6M9 16h4"/>
          </svg>
          רשימת קניות
          {shoppingList.length > 0 && (
            <span style={{ background: '#C9572A', color: '#fff', borderRadius: 9999, padding: '1px 8px', fontSize: 12, fontWeight: 700 }}>
              {shoppingList.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile: day tabs + single-day view ── */}
      <div className="md:hidden" style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 120px' }}>
        {/* Day tab strip */}
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12,
          scrollbarWidth: 'none', scrollSnapType: 'x mandatory',
        }}>
          {DAYS.map((dayLabel, dayIdx) => {
            const count = (plan[dayIdx] ?? []).length;
            const isActive = activeMobileDay === dayIdx;
            return (
              <button
                key={dayIdx}
                onClick={() => setActiveMobileDay(dayIdx)}
                style={{
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  minWidth: 64, minHeight: 44,
                  padding: '6px 14px',
                  borderRadius: 9999,
                  border: 'none',
                  background: isActive ? '#14422d' : '#e8e2d6',
                  color: isActive ? '#fff' : '#414943',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s',
                }}
              >
                {dayLabel}
                {count > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 14, height: 14, borderRadius: '50%',
                    background: isActive ? '#C9572A' : '#14422d',
                    color: '#fff', fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Single day view */}
        {(() => {
          const dayIdx = activeMobileDay;
          const dayRecipes = plan[dayIdx] ?? [];
          return (
            <div style={{
              background: 'var(--bg-surface)', borderRadius: 16,
              border: '1px solid var(--border)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 16px 10px',
                borderBottom: dayRecipes.length > 0 ? '1px solid #F0EBE3' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{DAYS[dayIdx]}</span>
                {dayRecipes.length > 0 && (
                  <span style={{ fontSize: 12, color: 'rgba(26,25,24,0.4)' }}>{dayRecipes.length} ארוחות</span>
                )}
              </div>

              <div style={{ padding: dayRecipes.length > 0 ? '12px 12px 4px' : 0 }}>
                <AnimatePresence>
                  {dayRecipes.map((recipeId, slotIdx) => {
                    const recipe = recipes.find(r => r.id === recipeId);
                    if (!recipe) return null;
                    const name = isHe ? recipe.nameHe : recipe.nameEn;
                    return (
                      <motion.div
                        key={`${recipeId}-${slotIdx}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          marginBottom: 10, borderRadius: 12,
                          overflow: 'hidden', border: '1px solid var(--border-2)',
                          background: 'var(--bg-surface-2)', display: 'flex',
                        }}
                      >
                        <div style={{ position: 'relative', width: 80, flexShrink: 0 }}>
                          <Image src={recipe.image} alt={name} fill sizes="80px" style={{ objectFit: 'cover' }} />
                          <button
                            onClick={() => removeRecipe(dayIdx, slotIdx)}
                            aria-label="הסר מתכון"
                            style={{
                              position: 'absolute', top: 5, right: 5,
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'rgba(201,87,42,0.92)', border: 'none',
                              color: '#fff', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                        <div style={{ padding: '10px 12px', flex: 1, display: 'flex', alignItems: 'center' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, margin: 0 }}>
                            {name}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setPickingDay(dayIdx)}
                style={{
                  width: 'calc(100% - 24px)', margin: '0 12px 12px',
                  padding: '14px', borderRadius: 12,
                  border: '1.5px dashed #D4CCBf', background: 'transparent',
                  color: 'rgba(26,25,24,0.4)', fontSize: 22, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >+</button>
            </div>
          );
        })()}
      </div>

      {/* ── Desktop: 7-day grid ── */}
      <div className="hidden md:block" style={{
        maxWidth: 1400, margin: '0 auto', padding: '20px 24px 80px',
        overflowX: 'auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(160px, 1fr))',
          gap: 12,
          minWidth: 1120,
        }}>
          {DAYS.map((dayLabel, dayIdx) => {
            const dayRecipes = plan[dayIdx] ?? [];
            return (
              <div
                key={dayIdx}
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Day header */}
                <div style={{
                  padding: '12px 14px 10px',
                  borderBottom: dayRecipes.length > 0 ? '1px solid #F0EBE3' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{dayLabel}</span>
                  {dayRecipes.length > 0 && (
                    <span style={{ fontSize: 11, color: 'rgba(26,25,24,0.4)' }}>{dayRecipes.length} ארוחות</span>
                  )}
                </div>

                {/* Recipe slots */}
                <div style={{ flex: 1, padding: dayRecipes.length > 0 ? '8px 0' : 0 }}>
                  <AnimatePresence>
                    {dayRecipes.map((recipeId, slotIdx) => {
                      const recipe = recipes.find(r => r.id === recipeId);
                      if (!recipe) return null;
                      const name = isHe ? recipe.nameHe : recipe.nameEn;

                      return (
                        <motion.div
                          key={`${recipeId}-${slotIdx}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            margin: '0 8px 8px',
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: '1px solid var(--border-2)',
                            background: 'var(--bg-surface-2)',
                          }}
                        >
                          {/* Recipe image */}
                          <div style={{ position: 'relative', height: 90 }}>
                            <Image
                              src={recipe.image}
                              alt={name}
                              fill
                              sizes="200px"
                              style={{ objectFit: 'cover' }}
                            />
                            {/* Remove button */}
                            <button
                              onClick={() => removeRecipe(dayIdx, slotIdx)}
                              aria-label="הסר מתכון"
                              style={{
                                position: 'absolute', top: 6, right: 6,
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'rgba(201,87,42,0.92)', border: 'none',
                                color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                            </button>
                          </div>

                          {/* Name */}
                          <div style={{ padding: '8px 10px' }}>
                            <p style={{
                              fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
                              lineHeight: 1.3, margin: 0,
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {name}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Add button */}
                <button
                  id={dayIdx === 0 ? 'tour-planner-add' : undefined}
                  onClick={() => setPickingDay(dayIdx)}
                  style={{
                    margin: '0 8px 10px',
                    padding: '10px',
                    borderRadius: 10,
                    border: '1.5px dashed #D4CCBf',
                    background: 'transparent',
                    color: 'rgba(26,25,24,0.4)',
                    fontSize: 20,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#14422d'; e.currentTarget.style.color = '#14422d'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D4CCBf'; e.currentTarget.style.color = 'rgba(26,25,24,0.4)'; }}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recipe picker modal ── */}
      <AnimatePresence>
        {pickingDay !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setPickingDay(null); setModalSearch(''); }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(26,25,24,0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                maxHeight: '80vh',
                background: 'var(--bg-page)',
                borderRadius: '20px 20px 0 0',
                zIndex: 101,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Modal header */}
              <div style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
              }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(26,25,24,0.4)" strokeWidth="2"
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="חפש מתכון..."
                    ref={searchInputRef}
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 36px 9px 14px',
                      borderRadius: 9999, border: '1px solid var(--border)',
                      background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)',
                      outline: 'none', direction: 'rtl',
                    }}
                  />
                </div>
                <button
                  onClick={() => { setPickingDay(null); setModalSearch(''); }}
                  aria-label="סגור"
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#c0c9c1', border: 'none',
                    cursor: 'pointer', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <p style={{ padding: '8px 20px', fontSize: 12, color: 'rgba(26,25,24,0.5)', flexShrink: 0 }}>
                בחר מתכון ל{DAYS[pickingDay]}
              </p>

              {/* Recipe grid */}
              <div style={{ overflowY: 'auto', padding: '0 16px 24px', flex: 1 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 10,
                }}>
                  {filteredForModal.map(recipe => {
                    const name = isHe ? recipe.nameHe : recipe.nameEn;
                    return (
                      <motion.button
                        key={recipe.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => addRecipe(pickingDay, recipe.id)}
                        style={{
                          background: 'var(--bg-surface)', border: '1px solid var(--border)',
                          borderRadius: 12, overflow: 'hidden',
                          cursor: 'pointer', textAlign: 'right', padding: 0,
                        }}
                      >
                        <div style={{ position: 'relative', height: 90 }}>
                          <Image src={recipe.image} alt={name} fill sizes="160px" style={{ objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <p style={{
                            fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
                            lineHeight: 1.3, margin: 0,
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>{name}</p>
                          <p style={{ fontSize: 10, color: 'rgba(26,25,24,0.4)', marginTop: 3 }}>
                            {recipe.prepTimeMin + recipe.cookTimeMin} דק׳
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Meal Prep recipe selection modal ── */}
      <AnimatePresence>
        {showMealPrepModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMealPrepModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(26,25,24,0.5)', backdropFilter: 'blur(4px)', zIndex: 100 }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                maxHeight: '80vh', background: 'var(--bg-page)',
                borderRadius: '20px 20px 0 0', zIndex: 101,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
              dir="rtl"
            >
              {/* Header */}
              <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>בחר מתכונים לבישול</h2>
                  <button onClick={() => setShowMealPrepModal(false)}
                    style={{ background: '#c0c9c1', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              </div>

              {/* Recipe list */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {plannerRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    onClick={() => setPrepSelectedIds(prev => {
                      const next = new Set(prev);
                      next.has(recipe.id) ? next.delete(recipe.id) : next.add(recipe.id);
                      return next;
                    })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-2)',
                      background: prepSelectedIds.has(recipe.id) ? '#EBF2ED' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      border: `2px solid ${prepSelectedIds.has(recipe.id) ? '#14422d' : '#D4CCBf'}`,
                      background: prepSelectedIds.has(recipe.id) ? '#14422d' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {prepSelectedIds.has(recipe.id) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#faf9f7" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                      <Image src={recipe.image} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{recipe.nameHe}</p>
                      <p style={{ fontSize: 11, color: 'rgba(26,25,24,0.45)', margin: 0 }}>{recipe.prepTimeMin + recipe.cookTimeMin} דק׳</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 20px', borderTop: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0, background: 'var(--bg-surface)',
              }}>
                <span style={{ fontSize: 12, color: 'rgba(26,25,24,0.5)' }}>
                  {prepSelectedIds.size > 0 ? `~${formatTimerMinutes(estimatedPrepMinutes)} משוערות` : 'בחר לפחות מתכון אחד'}
                </span>
                <button
                  disabled={prepSelectedIds.size === 0}
                  onClick={() => { setShowMealPrepModal(false); setShowMealPrepSession(true); }}
                  style={{
                    padding: '10px 24px', borderRadius: 9999,
                    background: prepSelectedIds.size === 0 ? '#c0c9c1' : '#14422d',
                    color: prepSelectedIds.size === 0 ? 'rgba(26,25,24,0.3)' : '#faf9f7',
                    fontSize: 13, fontWeight: 600, border: 'none',
                    cursor: prepSelectedIds.size === 0 ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  התחל בישול ←
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Meal Prep Session ── */}
      <AnimatePresence>
        {showMealPrepSession && (
          <MealPrepSession
            selectedRecipes={plannerRecipes.filter(r => prepSelectedIds.has(r.id))}
            onClose={() => setShowMealPrepSession(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Shopping list panel ── */}
      <AnimatePresence>
        {showShopping && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShopping(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(26,25,24,0.4)', zIndex: 100 }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 360, background: 'var(--bg-surface)', zIndex: 101,
                display: 'flex', flexDirection: 'column',
                boxShadow: '-8px 0 40px rgba(26,25,24,0.12)',
              }}
            >
              <div style={{
                padding: '20px 20px 14px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    רשימת קניות
                  </h2>
                  <button
                    onClick={() => setShowShopping(false)}
                    aria-label="סגור"
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: '#F0EBE3', border: 'none',
                      cursor: 'pointer', color: 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                {/* View toggle */}
                <div style={{
                  display: 'flex',
                  background: '#F0EBE3',
                  borderRadius: 9999,
                  padding: 3,
                  gap: 2,
                }}>
                  {(['general', 'byRecipe'] as const).map(view => (
                    <button
                      key={view}
                      onClick={() => setShoppingView(view)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: 9999,
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        background: shoppingView === view ? '#fff' : 'transparent',
                        color: shoppingView === view ? '#1a1c1b' : 'rgba(26,25,24,0.45)',
                        boxShadow: shoppingView === view ? '0 1px 4px rgba(26,25,24,0.10)' : 'none',
                      }}
                    >
                      {view === 'general' ? 'כללית' : 'לפי מתכון'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
                {shoppingList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(26,25,24,0.35)', fontSize: 14 }}>
                    <div style={{ marginBottom: 12, color: 'rgba(26,25,24,0.25)' }}><ShoppingCart size={36} strokeWidth={1.5} /></div>
                    הוסף ארוחות לפלאנר כדי לראות את רשימת הקניות
                  </div>
                ) : shoppingView === 'general' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {SHOPPING_CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
                      <div key={cat} style={{
                        background: 'var(--bg-surface)', borderRadius: 14,
                        padding: '12px', border: '1px solid #efeeec',
                        boxShadow: '0 2px 8px rgba(45,90,67,0.05)',
                      }}>
                        {/* Card header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ display: 'flex', alignItems: 'center', color: '#6B6560' }}>{getShoppingIcon(cat)}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{SHOPPING_LABEL_HE[cat]}</span>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: '#14422d',
                            background: 'rgba(20,66,45,0.08)', borderRadius: 9999, padding: '1px 6px',
                          }}>{grouped[cat].length}</span>
                        </div>
                        {/* Items */}
                        {grouped[cat].map((item, i) => {
                          const itemKey = `${cat}-${item.nameHe}-${i}`;
                          const isDone = checkedShoppingItems.has(itemKey);
                          return (
                            <div key={i} onClick={() => toggleShoppingItem(itemKey)} style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '5px 0', borderBottom: '1px solid #f0ebe3',
                              cursor: 'pointer',
                            }}>
                              <span style={{
                                width: 14, height: 14, flexShrink: 0, borderRadius: 4,
                                border: `1.5px solid ${isDone ? '#14422d' : '#c0c9c1'}`,
                                background: isDone ? '#14422d' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {isDone && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </span>
                              <span style={{ flex: 1, fontSize: 11, color: isDone ? '#b0b8b2' : '#1a1c1b', textDecoration: isDone ? 'line-through' : 'none' }}>
                                {isHe ? item.nameHe : item.nameEn}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: isDone ? '#c0c9c1' : '#14422d', flexShrink: 0 }}>
                                {item.quantity > 0 ? `${item.quantity}` : ''} {t(`unit.${item.unit}`)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  perRecipeLists.map(({ recipe, servings, items }) => (
                    <div key={recipe.id} style={{
                      marginBottom: 20,
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}>
                      {/* Recipe header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px',
                        background: 'var(--bg-surface)',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                          <Image src={recipe.image} alt="" fill sizes="36px" style={{ objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isHe ? recipe.nameHe : recipe.nameEn}
                          </p>
                          <p style={{ fontSize: 11, color: 'rgba(26,25,24,0.45)', margin: 0 }}>{servings} מנות</p>
                        </div>
                      </div>
                      {/* Items */}
                      <div style={{ padding: '4px 12px 8px' }}>
                        {items.map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '6px 0', borderBottom: i < items.length - 1 ? '1px solid #F0EBE3' : 'none',
                          }}>
                            <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                              {isHe ? item.nameHe : item.nameEn}
                              {item.optional && <span style={{ fontSize: 10, color: 'rgba(26,25,24,0.4)', marginInlineStart: 4 }}>(אופציונלי)</span>}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#14422d', flexShrink: 0 }}>
                              {item.quantity > 0 ? `${item.quantity} ${t(`unit.${item.unit}`)}` : t(`unit.${item.unit}`)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const serveBtnStyle: React.CSSProperties = {
  width: 20, height: 20, borderRadius: '50%',
  background: '#F0EBE3', border: 'none',
  fontSize: 13, cursor: 'pointer', color: 'var(--text-primary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, lineHeight: 1, padding: 0,
};
