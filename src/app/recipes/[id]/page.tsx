'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { use, useState, useEffect } from 'react';
import { getRecipeById } from '@/data/recipes';

const STORAGE_KEY_HISTORY = 'easyprep_cook_history';

function todayStr() { return new Date().toISOString().slice(0, 10); }

function hasCookedToday(): boolean {
  try {
    const history: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) ?? '[]');
    return history.some(d => d.slice(0, 10) === todayStr());
  } catch { return false; }
}

function markCooked() {
  try {
    const history: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) ?? '[]');
    history.push(new Date().toISOString());
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch { /* ignore */ }
}
import { useLanguage } from '@/context/LanguageContext';
import IngredientList from '@/components/recipes/IngredientList';
import StepByStep from '@/components/recipes/StepByStep';
import PortionSelector from '@/components/recipes/PortionSelector';
import { DietaryTag } from '@/types';

const CATEGORY_GRADIENT: Record<string, string> = {
  fish:      'from-sky-100 to-blue-200',
  chicken:   'from-amber-100 to-orange-200',
  turkey:    'from-orange-100 to-red-200',
  tofu:      'from-lime-100 to-emerald-200',
  breakfast: 'from-yellow-100 to-amber-200',
  beef:      'from-red-100 to-rose-200',
  salad:     'from-green-100 to-teal-200',
  side:      'from-stone-100 to-zinc-200',
};

const DIETARY_BADGE: Record<DietaryTag, { he: string; en: string; color: string }> = {
  'vegan':        { he: 'טבעוני',      en: 'Vegan',        color: 'bg-green-100 text-green-800' },
  'vegetarian':   { he: 'צמחוני',      en: 'Veggie',       color: 'bg-lime-100 text-lime-800' },
  'gluten-free':  { he: 'ללא גלוטן',   en: 'Gluten-Free',  color: 'bg-amber-100 text-amber-800' },
  'dairy-free':   { he: 'ללא חלב',     en: 'Dairy-Free',   color: 'bg-sky-100 text-sky-800' },
  'high-protein': { he: 'עשיר בחלבון', en: 'High-Protein', color: 'bg-emerald-100 text-emerald-800' },
  'low-carb':     { he: 'דל פחמימות',  en: 'Low-Carb',     color: 'bg-violet-100 text-violet-800' },
};

export default function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale, t } = useLanguage();
  const recipe = getRecipeById(id);

  const [cookedToday, setCookedToday] = useState(false);
  const [justMarked, setJustMarked] = useState(false);

  useEffect(() => {
    setCookedToday(hasCookedToday());
  }, []);

  function handleMarkCooked() {
    markCooked();
    setCookedToday(true);
    setJustMarked(true);
  }

  if (!recipe) notFound();

  const name = locale === 'he' ? recipe.nameHe : recipe.nameEn;
  const description = locale === 'he' ? recipe.descriptionHe : recipe.descriptionEn;
  const gradient = CATEGORY_GRADIENT[recipe.category] ?? 'from-gray-100 to-zinc-200';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-emerald-600 transition-colors mb-6"
      >
        <span className="rtl:rotate-180 inline-block">←</span>
        {t('recipe.backToRecipes')}
      </Link>

      {/* Hero image */}
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} h-64 sm:h-80 mb-6`}>
        <Image
          src={recipe.image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Dietary badges */}
      {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {recipe.dietaryTags.map((tag) => {
            const b = DIETARY_BADGE[tag];
            return (
              <span key={tag} className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${b.color}`}>
                {locale === 'he' ? b.he : b.en}
              </span>
            );
          })}
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#18181b] mb-2">{name}</h1>

      {/* Chef attribution */}
      {recipe.chefName && (
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
            {recipe.chefName.charAt(0)}
          </span>
          <span className="text-sm text-zinc-500">{recipe.chefName}</span>
        </div>
      )}

      <p className="text-zinc-500 mb-5">{description}</p>

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 text-sm text-zinc-600 mb-5 pb-5 border-b border-zinc-100">
        <span>⏱ {t('recipe.prepTime')}: {recipe.prepTimeMin} {t('recipe.minutes')}</span>
        {recipe.cookTimeMin > 0 && (
          <span>🔥 {t('recipe.cookTime')}: {recipe.cookTimeMin} {t('recipe.minutes')}</span>
        )}
        <span>📦 {recipe.baseServings} {t('recipe.servings')}</span>
        <span>🧊 {recipe.storageDays} {t('recipe.days')}</span>
      </div>

      {/* Nutrition pills */}
      {recipe.nutritionPerServing && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
            {t('nutrition.perServing')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: t('nutrition.calories'), value: recipe.nutritionPerServing.calories, unit: '' },
              { label: t('nutrition.protein'),  value: recipe.nutritionPerServing.protein,  unit: 'g' },
              { label: t('nutrition.carbs'),    value: recipe.nutritionPerServing.carbs,    unit: 'g' },
              { label: t('nutrition.fat'),      value: recipe.nutritionPerServing.fat,      unit: 'g' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-center">
                <p className="text-lg font-bold text-[#18181b]">{value}{unit}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Ingredients */}
        <div>
          <h2 className="text-lg font-bold text-[#18181b] mb-4">{t('recipe.ingredients')}</h2>
          <IngredientList
            ingredients={recipe.ingredients}
            portions={recipe.baseServings}
            baseServings={recipe.baseServings}
          />
        </div>

        {/* Portion selector */}
        <div>
          <PortionSelector recipeId={recipe.id} baseServings={recipe.baseServings} />
        </div>
      </div>

      {/* Steps */}
      <div>
        <h2 className="text-lg font-bold text-[#18181b] mb-4">{t('recipe.steps')}</h2>
        <StepByStep steps={recipe.steps} />
      </div>

      {/* Mark as cooked */}
      <div className="mt-8 pt-6 border-t border-zinc-100 flex justify-center">
        <button
          onClick={handleMarkCooked}
          disabled={cookedToday}
          style={{
            padding: '12px 28px',
            borderRadius: 9999,
            background: cookedToday ? '#E5E0D8' : '#2A4F3A',
            color: cookedToday ? '#6B6560' : '#FFFFFF',
            fontSize: 15,
            fontWeight: 700,
            border: 'none',
            cursor: cookedToday ? 'default' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {cookedToday
            ? (justMarked ? '✓ נרשם! כל הכבוד' : '✓ הכנת היום')
            : 'הכנתי היום'}
        </button>
      </div>
    </div>
  );
}
