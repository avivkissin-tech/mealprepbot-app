'use client';

import { useState } from 'react';
import { Recipe, RecipeCategory } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import RecipeCard from './RecipeCard';

const FILTER_KEYS = ['all', 'fish', 'chicken', 'turkey', 'tofu', 'breakfast'] as const;

interface Props {
  recipes: Recipe[];
}

export default function RecipeGrid({ recipes }: Props) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'all' | RecipeCategory>('all');

  const filtered =
    activeFilter === 'all'
      ? recipes
      : recipes.filter((r) => r.category === activeFilter);

  return (
    <section>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key as 'all' | RecipeCategory)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              activeFilter === key
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
            }`}
          >
            {t(`home.filter.${key}`)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </section>
  );
}
