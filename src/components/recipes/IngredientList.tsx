'use client';

import { Ingredient } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  ingredients: Ingredient[];
  portions: number;
  baseServings: number;
}

export default function IngredientList({ ingredients, portions, baseServings }: Props) {
  const { locale, t } = useLanguage();
  const multiplier = portions / baseServings;

  function formatQuantity(qty: number): string {
    const scaled = qty * multiplier;
    if (scaled === 0) return '';
    const rounded = scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 2) / 2;
    return rounded % 1 === 0 ? String(rounded) : String(rounded);
  }

  function unitLabel(unit: string): string {
    return t(`unit.${unit}`);
  }

  return (
    <ul className="space-y-2">
      {ingredients.map((ing, i) => {
        const name = locale === 'he' ? ing.nameHe : ing.nameEn;
        const qty = ing.unit === 'to_taste' ? '' : formatQuantity(ing.quantity);
        const unit = unitLabel(ing.unit);

        return (
          <li
            key={i}
            className={`flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0 ${
              ing.optional ? 'opacity-60' : ''
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="flex-1 text-gray-800 text-sm">{name}</span>
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              {qty} {unit}
              {ing.optional && (
                <span className="ms-1 text-xs text-gray-400">({t('recipe.optional')})</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
