'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { recipes } from '@/data/recipes';
import { calculateShoppingList, mergeShoppingLists, groupByCategory, SHOPPING_CATEGORY_ORDER } from '@/lib/shoppingList';
import { ShoppingCategory } from '@/types';

const DAYS = ['יום 1', 'יום 2', 'יום 3', 'יום 4', 'יום 5', 'יום 6', 'יום 7'];

const SHOPPING_ICON: Record<ShoppingCategory, string> = {
  protein: '🥩', vegetables: '🥦', dairy: '🥛',
  grains: '🌾', spices: '🧂', other: '🛒',
};

const SHOPPING_LABEL_HE: Record<ShoppingCategory, string> = {
  protein: 'חלבונים', vegetables: 'ירקות', dairy: 'חלב ומוצריו',
  grains: 'דגנים', spices: 'תבלינים', other: 'שונות',
};

export default function PlannerPage() {
  const { locale } = useLanguage();
  const isHe = locale === 'he';

  // day index → array of recipe IDs (can repeat)
  const [plan, setPlan] = useState<Record<number, string[]>>({});
  // `${day}-${slotIndex}` → serves
  const [serves, setServes] = useState<Record<string, number>>({});
  // modal
  const [pickingDay, setPickingDay] = useState<number | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  // shopping panel
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingView, setShoppingView] = useState<'general' | 'byRecipe'>('general');

  const addRecipe = (day: number, recipeId: string) => {
    setPlan(prev => {
      const current = prev[day] ?? [];
      const newList = [...current, recipeId];
      // default serves = baseServings of recipe
      const recipe = recipes.find(r => r.id === recipeId);
      const slotKey = `${day}-${current.length}`;
      setServes(s => ({ ...s, [slotKey]: recipe?.baseServings ?? 2 }));
      return { ...prev, [day]: newList };
    });
    setPickingDay(null);
    setModalSearch('');
  };

  const removeRecipe = (day: number, slotIdx: number) => {
    setPlan(prev => {
      const current = [...(prev[day] ?? [])];
      current.splice(slotIdx, 1);
      // re-key serves for remaining slots
      setServes(s => {
        const next = { ...s };
        delete next[`${day}-${slotIdx}`];
        // shift down keys after removed slot
        for (let i = slotIdx; i < current.length; i++) {
          next[`${day}-${i}`] = next[`${day}-${i + 1}`] ?? 2;
          delete next[`${day}-${i + 1}`];
        }
        return next;
      });
      return { ...prev, [day]: current };
    });
  };

  const adjustServes = (day: number, slotIdx: number, delta: number) => {
    const key = `${day}-${slotIdx}`;
    setServes(prev => ({ ...prev, [key]: Math.max(1, Math.min(20, (prev[key] ?? 2) + delta)) }));
  };

  // Aggregate shopping list from all plan slots
  const shoppingList = useMemo(() => {
    const lists = [];
    for (const [dayStr, recipeIds] of Object.entries(plan)) {
      const day = Number(dayStr);
      for (let i = 0; i < recipeIds.length; i++) {
        const recipe = recipes.find(r => r.id === recipeIds[i]);
        if (recipe) {
          const s = serves[`${day}-${i}`] ?? recipe.baseServings;
          lists.push(calculateShoppingList(recipe, s));
        }
      }
    }
    return mergeShoppingLists(lists);
  }, [plan, serves]);

  const grouped = groupByCategory(shoppingList);

  // Per-recipe breakdown for "by recipe" view
  const perRecipeLists = useMemo(() => {
    const result: { key: string; recipe: typeof recipes[0]; servings: number; items: ReturnType<typeof calculateShoppingList> }[] = [];
    for (const [dayStr, recipeIds] of Object.entries(plan)) {
      const day = Number(dayStr);
      for (let i = 0; i < recipeIds.length; i++) {
        const recipe = recipes.find(r => r.id === recipeIds[i]);
        if (recipe) {
          const s = serves[`${day}-${i}`] ?? recipe.baseServings;
          result.push({ key: `${day}-${i}`, recipe, servings: s, items: calculateShoppingList(recipe, s) });
        }
      }
    }
    return result;
  }, [plan, serves]);

  const totalRecipes = Object.values(plan).reduce((sum, arr) => sum + arr.length, 0);

  const filteredForModal = useMemo(() => {
    if (!modalSearch.trim()) return recipes;
    const q = modalSearch.toLowerCase();
    return recipes.filter(r => r.nameHe.includes(q) || r.nameEn.toLowerCase().includes(q));
  }, [modalSearch]);

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F7F3EE' }}>

      {/* ── Header bar ── */}
      <div style={{
        maxWidth: 1400, margin: '0 auto', padding: '24px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1A1918', margin: 0 }}>הפלאנר שלי</h1>
          <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.5)', marginTop: 2 }}>
            {totalRecipes > 0 ? `${totalRecipes} ארוחות מתוכננות השבוע` : 'לחץ + להוסיף ארוחה לכל יום'}
          </p>
        </div>
        <button
          onClick={() => setShowShopping(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 9999,
            background: '#1A1918', color: '#F7F3EE',
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
            <span style={{
              background: '#C9572A', color: '#fff',
              borderRadius: 9999, padding: '1px 7px', fontSize: 11, fontWeight: 700,
            }}>
              {shoppingList.length}
            </span>
          )}
        </button>
      </div>

      {/* ── 7-day grid ── */}
      <div style={{
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
                  background: '#fff',
                  borderRadius: 16,
                  border: '1px solid #E0D9CE',
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1918' }}>{dayLabel}</span>
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
                      const slotKey = `${dayIdx}-${slotIdx}`;
                      const currentServes = serves[slotKey] ?? recipe.baseServings;

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
                            border: '1px solid #F0EBE3',
                            background: '#FAFAF8',
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
                              style={{
                                position: 'absolute', top: 6, right: 6,
                                width: 22, height: 22, borderRadius: '50%',
                                background: 'rgba(26,25,24,0.7)', border: 'none',
                                color: '#fff', fontSize: 12, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          </div>

                          {/* Name + serves */}
                          <div style={{ padding: '8px 10px' }}>
                            <p style={{
                              fontSize: 11, fontWeight: 600, color: '#1A1918',
                              lineHeight: 1.3, marginBottom: 6,
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {name}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 10, color: 'rgba(26,25,24,0.45)' }}>מנות</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  onClick={() => adjustServes(dayIdx, slotIdx, -1)}
                                  style={{ ...serveBtnStyle }}
                                >−</button>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1918', minWidth: 14, textAlign: 'center' }}>
                                  {currentServes}
                                </span>
                                <button
                                  onClick={() => adjustServes(dayIdx, slotIdx, 1)}
                                  style={{ ...serveBtnStyle }}
                                >+</button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Add button */}
                <button
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
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2A4F3A'; e.currentTarget.style.color = '#2A4F3A'; }}
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
                background: '#F7F3EE',
                borderRadius: '20px 20px 0 0',
                zIndex: 101,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Modal header */}
              <div style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid #E0D9CE',
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
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%', padding: '9px 36px 9px 14px',
                      borderRadius: 9999, border: '1px solid #E0D9CE',
                      background: '#fff', fontSize: 14, color: '#1A1918',
                      outline: 'none', direction: 'rtl',
                    }}
                  />
                </div>
                <button
                  onClick={() => { setPickingDay(null); setModalSearch(''); }}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#E0D9CE', border: 'none',
                    fontSize: 16, cursor: 'pointer', color: '#1A1918',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
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
                          background: '#fff', border: '1px solid #E0D9CE',
                          borderRadius: 12, overflow: 'hidden',
                          cursor: 'pointer', textAlign: 'right', padding: 0,
                        }}
                      >
                        <div style={{ position: 'relative', height: 90 }}>
                          <Image src={recipe.image} alt={name} fill sizes="160px" style={{ objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <p style={{
                            fontSize: 11, fontWeight: 600, color: '#1A1918',
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
                width: 360, background: '#fff', zIndex: 101,
                display: 'flex', flexDirection: 'column',
                boxShadow: '-8px 0 40px rgba(26,25,24,0.12)',
              }}
            >
              <div style={{
                padding: '20px 20px 14px',
                borderBottom: '1px solid #E0D9CE',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1A1918', margin: 0 }}>
                    רשימת קניות
                  </h2>
                  <button
                    onClick={() => setShowShopping(false)}
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: '#F0EBE3', border: 'none',
                      fontSize: 16, cursor: 'pointer', color: '#1A1918',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >×</button>
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
                        color: shoppingView === view ? '#1A1918' : 'rgba(26,25,24,0.45)',
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
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>
                    הוסף ארוחות לפלאנר כדי לראות את רשימת הקניות
                  </div>
                ) : shoppingView === 'general' ? (
                  SHOPPING_CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
                    <div key={cat} style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 16 }}>{SHOPPING_ICON[cat]}</span>
                        <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1A1918', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {SHOPPING_LABEL_HE[cat]}
                        </h3>
                      </div>
                      {grouped[cat].map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 0', borderBottom: '1px solid #F0EBE3',
                        }}>
                          <span style={{ fontSize: 13, color: '#1A1918' }}>
                            {isHe ? item.nameHe : item.nameEn}
                            {item.optional && <span style={{ fontSize: 11, color: 'rgba(26,25,24,0.4)', marginRight: 4 }}>(אופציונלי)</span>}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#2A4F3A', flexShrink: 0 }}>
                            {item.quantity > 0 ? `${item.quantity} ${item.unit}` : item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  perRecipeLists.map(({ key, recipe, servings, items }) => (
                    <div key={key} style={{
                      marginBottom: 20,
                      border: '1px solid #E0D9CE',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}>
                      {/* Recipe header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px',
                        background: '#F7F3EE',
                        borderBottom: '1px solid #E0D9CE',
                      }}>
                        <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                          <Image src={recipe.image} alt="" fill sizes="36px" style={{ objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#1A1918', margin: 0,
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
                            <span style={{ fontSize: 12, color: '#1A1918' }}>
                              {isHe ? item.nameHe : item.nameEn}
                              {item.optional && <span style={{ fontSize: 10, color: 'rgba(26,25,24,0.4)', marginRight: 4 }}>(אופציונלי)</span>}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#2A4F3A', flexShrink: 0 }}>
                              {item.quantity > 0 ? `${item.quantity} ${item.unit}` : item.unit}
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
  fontSize: 13, cursor: 'pointer', color: '#1A1918',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, lineHeight: 1, padding: 0,
};
