'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  recipeId: string;
  baseServings: number;
  onPortionsChange?: (portions: number) => void;
}

export default function PortionSelector({ recipeId, baseServings, onPortionsChange }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const [portions, setPortions] = useState(baseServings);

  function updatePortions(val: number) {
    setPortions(val);
    onPortionsChange?.(val);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/recipes/${recipeId}/shopping?portions=${portions}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-emerald-50 rounded-2xl p-5 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          {t('recipe.portions.label')}
        </label>
        <p className="text-xs text-gray-500 mb-3">{t('recipe.portions.hint')}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updatePortions(Math.max(1, portions - 1))}
            className="w-9 h-9 rounded-full border-2 border-emerald-300 text-emerald-700 font-bold text-lg flex items-center justify-center hover:bg-emerald-100 transition-colors"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={50}
            value={portions}
            onChange={(e) => updatePortions(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="w-16 text-center text-xl font-bold text-gray-900 border-2 border-emerald-300 rounded-xl py-1 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => updatePortions(Math.min(50, portions + 1))}
            className="w-9 h-9 rounded-full border-2 border-emerald-300 text-emerald-700 font-bold text-lg flex items-center justify-center hover:bg-emerald-100 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        🛒 {t('recipe.portions.button')}
      </button>
    </form>
  );
}
