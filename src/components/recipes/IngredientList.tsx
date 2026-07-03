'use client';

import { useState } from 'react';
import { Ingredient } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  ingredients: Ingredient[];
  portions: number;
  baseServings: number;
}

export default function IngredientList({ ingredients, portions, baseServings }: Props) {
  const { locale, t } = useLanguage();
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const multiplier = portions / baseServings;

  const PLURAL_UNITS = new Set(['cup', 'tbsp', 'tsp', 'can', 'pinch']);

  function formatQuantity(qty: number): string {
    const scaled = qty * multiplier;
    if (scaled === 0) return '';
    const rounded = scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 2) / 2;
    return String(rounded);
  }

  function unitLabel(unit: string, qty: number): string {
    const scaled = qty * multiplier;
    if (PLURAL_UNITS.has(unit) && scaled > 1) {
      const plural = t(`unit.${unit}_plural`);
      if (plural) return plural;
    }
    return t(`unit.${unit}`);
  }

  function toggle(i: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {ingredients.map((ing, i) => {
        const name = locale === 'he' ? ing.nameHe : ing.nameEn;
        const qty = ing.unit === 'to_taste' ? '' : formatQuantity(ing.quantity);
        const unit = ing.unit === 'to_taste' ? t('unit.to_taste') : unitLabel(ing.unit, ing.quantity);
        const isDone = checked.has(i);

        return (
          <li
            key={i}
            onClick={() => toggle(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid #f0ebe3',
              cursor: 'pointer',
              opacity: ing.optional ? 0.65 : 1,
            }}
          >
            {/* Checkbox */}
            <span style={{
              width: 20, height: 20, flexShrink: 0,
              borderRadius: 6, border: `2px solid ${isDone ? '#14422d' : '#c0c9c1'}`,
              background: isDone ? '#14422d' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {isDone && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            {/* Name */}
            <span style={{
              flex: 1, fontSize: 14, color: isDone ? '#b0b8b2' : '#1a1c1b',
              textDecoration: isDone ? 'line-through' : 'none',
              transition: 'all 0.15s',
            }}>
              {name}
              {ing.optional && (
                <span style={{ fontSize: 11, color: '#b0b8b2', marginInlineStart: 4 }}>({t('recipe.optional')})</span>
              )}
            </span>
            {/* Quantity */}
            <span style={{
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              color: isDone ? '#c0c9c1' : '#14422d',
              transition: 'color 0.15s',
            }}>
              {qty} {unit}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
