'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useMealPlan } from '@/context/MealPlanContext';
import { calculateShoppingList, mergeShoppingLists, groupByCategory, SHOPPING_CATEGORY_ORDER } from '@/lib/shoppingList';
import { ShoppingCategory } from '@/types';

type PanelView = 'recipes' | 'shopping';

const CATEGORY_ICON: Record<ShoppingCategory, string> = {
  protein:    '🥩',
  vegetables: '🥦',
  dairy:      '🥛',
  grains:     '🌾',
  spices:     '🧂',
  other:      '🛒',
};

export default function MealPlanPanel() {
  const { t, locale } = useLanguage();
  const { selectedRecipes, getPortion, adjustPortion, removeRecipe, clear } = useMealPlan();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PanelView>('recipes');

  const count = selectedRecipes.length;

  const mergedList = mergeShoppingLists(
    selectedRecipes.map((r) => calculateShoppingList(r, getPortion(r)))
  );
  const grouped = groupByCategory(mergedList);

  if (count === 0 && !open) {
    return null;
  }

  return (
    <>
      {/* FAB button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 end-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl transition-all print:hidden"
          style={{ background: '#2A4F3A', color: '#FFFFFF', boxShadow: '0 8px 32px rgba(42,79,58,0.35)' }}
        >
          <span className="text-lg">🥗</span>
          <span className="font-bold text-sm">{t('plan.title')}</span>
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: '#C9572A', color: '#FFFFFF' }}
          >
            {count}
          </span>
        </button>
      )}

      {/* Panel overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end print:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#1A1918]/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative w-full sm:w-[380px] sm:h-auto sm:max-h-[85vh] h-[90vh] rounded-t-2xl sm:rounded-2xl sm:me-4 sm:mb-4 flex flex-col overflow-hidden"
            style={{ background: '#F7F3EE', boxShadow: '0 16px 48px rgba(26,25,24,0.25)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: '#E0D9CE' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🥗</span>
                <h2 className="font-bold text-sm" style={{ color: '#1A1918' }}>{t('plan.title')}</h2>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: '#2A4F3A', color: '#FFFFFF' }}
                >
                  {count}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <button
                    onClick={clear}
                    className="text-[11px] font-medium opacity-40 hover:opacity-70 transition-opacity"
                    style={{ color: '#1A1918' }}
                  >
                    {t('plan.clear')}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: '#EDE7DC', color: '#6B6560' }}
                  aria-label="Close"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                    <path d="M2 2l10 10M2 12L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tab bar */}
            {count > 0 && (
              <div
                className="flex border-b flex-shrink-0"
                style={{ borderColor: '#E0D9CE' }}
              >
                {(['recipes', 'shopping'] as PanelView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className="flex-1 py-2.5 text-xs font-semibold transition-colors"
                    style={{
                      color: view === v ? '#2A4F3A' : '#A09893',
                      borderBottom: view === v ? '2px solid #2A4F3A' : '2px solid transparent',
                    }}
                  >
                    {v === 'recipes'
                      ? (locale === 'he' ? 'מתכונים' : 'Recipes')
                      : t('plan.viewList')}
                  </button>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {count === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-10">
                  <span className="text-4xl opacity-30">🥗</span>
                  <p className="text-sm text-center opacity-40" style={{ color: '#1A1918' }}>
                    {t('plan.empty')}
                  </p>
                </div>
              ) : view === 'recipes' ? (
                /* ── Recipes tab ── */
                <div className="px-4 py-3 space-y-3">
                  {selectedRecipes.map((recipe) => {
                    const name = locale === 'he' ? recipe.nameHe : recipe.nameEn;
                    const p = getPortion(recipe);
                    return (
                      <div
                        key={recipe.id}
                        className="flex items-center gap-3 rounded-xl p-3"
                        style={{ background: '#FFFFFF', border: '1px solid #E0D9CE' }}
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#EDE7DC]">
                          <Image
                            src={recipe.image}
                            alt={name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        {/* Name + portions */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs leading-snug truncate" style={{ color: '#1A1918' }}>
                            {name}
                          </p>
                          {/* Portion stepper */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button
                              onClick={() => adjustPortion(recipe.id, -1)}
                              className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold transition-colors hover:border-[#2A4F3A] hover:text-[#2A4F3A]"
                              style={{ borderColor: '#E0D9CE', color: '#6B6560' }}
                            >
                              −
                            </button>
                            <span className="text-xs font-semibold w-6 text-center" style={{ color: '#1A1918' }}>
                              {p}
                            </span>
                            <button
                              onClick={() => adjustPortion(recipe.id, 1)}
                              className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold transition-colors hover:border-[#2A4F3A] hover:text-[#2A4F3A]"
                              style={{ borderColor: '#E0D9CE', color: '#6B6560' }}
                            >
                              +
                            </button>
                            <span className="text-[11px] opacity-50 ms-0.5" style={{ color: '#1A1918' }}>
                              {t('recipe.servings')}
                            </span>
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeRecipe(recipe.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[#FAE9E1]"
                          style={{ color: '#C9572A' }}
                          aria-label="Remove"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                            <path d="M2 2l8 8M2 10L10 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ── Shopping list tab ── */
                <div className="px-4 py-3">
                  {mergedList.length === 0 ? (
                    <p className="text-xs opacity-40 text-center py-6" style={{ color: '#1A1918' }}>
                      {locale === 'he' ? 'אין פריטים' : 'No items'}
                    </p>
                  ) : (
                    SHOPPING_CATEGORY_ORDER
                      .filter((cat) => grouped[cat]?.length > 0)
                      .map((cat) => (
                        <div key={cat} className="mb-4">
                          {/* Category header */}
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-sm">{CATEGORY_ICON[cat]}</span>
                            <h3 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#A09893' }}>
                              {t(`shopping.category.${cat}`)}
                            </h3>
                          </div>
                          {/* Items */}
                          <div className="space-y-1">
                            {grouped[cat].map((item, i) => (
                              <ShoppingRow key={i} item={item} />
                            ))}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            {count > 0 && (
              <div
                className="px-4 py-4 border-t flex-shrink-0"
                style={{ borderColor: '#E0D9CE', background: '#F7F3EE' }}
              >
                <Link
                  href="/mealprep"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors"
                  style={{ background: '#2A4F3A', color: '#FFFFFF' }}
                >
                  ✨ {t('plan.startCooking')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ShoppingRow({ item }: { item: { nameHe: string; nameEn: string; quantity: number; unit: string; optional: boolean } }) {
  const { locale, t } = useLanguage();
  const name = locale === 'he' ? item.nameHe : item.nameEn;
  const unitLabel = item.unit !== 'unit' && item.unit !== 'to_taste'
    ? t(`unit.${item.unit}`)
    : '';

  return (
    <div
      className="flex items-center justify-between py-1.5 px-3 rounded-lg"
      style={{ background: '#FFFFFF', border: '1px solid #EDE7DC' }}
    >
      <span className="text-xs" style={{ color: item.optional ? '#A09893' : '#1A1918' }}>
        {name}
        {item.optional && (
          <span className="ms-1 opacity-50 text-[10px]">({t('recipe.optional')})</span>
        )}
      </span>
      <span className="text-xs font-semibold flex-shrink-0 ms-2" style={{ color: '#2A4F3A' }}>
        {item.quantity > 0 && item.unit !== 'to_taste'
          ? `${item.quantity}${unitLabel ? ' ' + unitLabel : ''}`
          : t('unit.to_taste')}
      </span>
    </div>
  );
}
