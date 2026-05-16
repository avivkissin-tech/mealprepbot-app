'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { getRecipeById } from '@/data/recipes';
import { calculateShoppingList } from '@/lib/shoppingList';
import { useLanguage } from '@/context/LanguageContext';
import ShoppingList from '@/components/shopping/ShoppingList';

export default function ShoppingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ portions?: string }>;
}) {
  const { id } = use(params);
  const { portions: portionsStr } = use(searchParams);
  const { locale, t } = useLanguage();

  const recipe = getRecipeById(id);
  if (!recipe) notFound();

  const portions = Math.max(1, Math.min(50, Number(portionsStr) || recipe.baseServings));
  const entries = calculateShoppingList(recipe, portions);
  const name = locale === 'he' ? recipe.nameHe : recipe.nameEn;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/recipes/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition-colors mb-6 print:hidden"
      >
        <span className="rtl:rotate-180 inline-block">←</span>
        {t('shopping.backToRecipe')}
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <ShoppingList entries={entries} recipeName={name} portions={portions} />
      </div>
    </div>
  );
}
