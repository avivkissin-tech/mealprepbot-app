'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Recipe, DietaryTag } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useMealPlan } from '@/context/MealPlanContext';

const CATEGORY_GRADIENT: Record<string, string> = {
  fish:      'from-sky-200 to-blue-300',
  chicken:   'from-amber-200 to-orange-300',
  turkey:    'from-orange-200 to-red-300',
  tofu:      'from-lime-200 to-emerald-300',
  breakfast: 'from-yellow-200 to-amber-300',
  beef:      'from-red-200 to-rose-300',
  salad:     'from-green-200 to-teal-300',
  side:      'from-stone-200 to-zinc-300',
};

const CATEGORY_EMOJI: Record<string, string> = {
  fish: '🐟', chicken: '🍗', turkey: '🦃', tofu: '🌿',
  breakfast: '🌅', beef: '🥩', salad: '🥗', side: '🍚',
};

export const DIETARY_BADGE: Record<DietaryTag, { he: string; en: string; color: string }> = {
  'vegan':        { he: 'טבעוני',      en: 'Vegan',        color: 'bg-[#EBF2ED] text-[#2A4F3A]' },
  'vegetarian':   { he: 'צמחוני',      en: 'Veggie',       color: 'bg-[#EBF2ED] text-[#2A4F3A]' },
  'gluten-free':  { he: 'ללא גלוטן',   en: 'Gluten-Free',  color: 'bg-amber-50 text-amber-800' },
  'dairy-free':   { he: 'ללא חלב',     en: 'Dairy-Free',   color: 'bg-sky-50 text-sky-800' },
  'high-protein': { he: 'עשיר בחלבון', en: 'High-Protein', color: 'bg-[#FAE9E1] text-[#C9572A]' },
  'low-carb':     { he: 'דל פחמימות',  en: 'Low-Carb',     color: 'bg-violet-50 text-violet-700' },
};

interface Props {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: Props) {
  const { locale, t } = useLanguage();
  const { isSelected, toggleRecipe } = useMealPlan();
  const selected = isSelected(recipe.id);
  const name = locale === 'he' ? recipe.nameHe : recipe.nameEn;
  const totalMin = recipe.prepTimeMin + recipe.cookTimeMin;
  const primaryTag = recipe.dietaryTags?.[0];
  const badge = primaryTag ? DIETARY_BADGE[primaryTag] : null;
  const gradient = CATEGORY_GRADIENT[recipe.category] ?? 'from-stone-200 to-zinc-300';

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group block w-60 flex-shrink-0 snap-start"
    >
      {/* Image */}
      <div
        className={`relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} mb-3`}
        style={{ boxShadow: '0 4px 20px rgba(26,25,24,0.10)' }}
      >
        <Image
          src={recipe.image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="240px"
        />
        {/* Soft vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1918]/25 via-transparent to-transparent" />
        {/* Emoji fallback */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-5xl opacity-25">{CATEGORY_EMOJI[recipe.category] ?? '🍽️'}</span>
        </div>
        {/* Add to plan button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleRecipe(recipe.id); }}
          aria-label={selected ? 'Remove from plan' : 'Add to plan'}
          className={`absolute top-2.5 end-2.5 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md z-10 ${
            selected
              ? 'bg-[#2A4F3A] text-white scale-110'
              : 'bg-white/90 text-[#2A4F3A] hover:bg-[#2A4F3A] hover:text-white'
          }`}
        >
          {selected ? '✓' : '+'}
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        {badge && (
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.color}`}>
            {locale === 'he' ? badge.he : badge.en}
          </span>
        )}
        <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-[#EDE7DC] text-[#6B6560]">
          {totalMin} {t('recipe.minutes')}
        </span>
      </div>

      {/* Name */}
      <h3
        className="font-bold text-[#1A1918] text-sm leading-snug line-clamp-2 mb-1 group-hover:text-[#2A4F3A] transition-colors"
        style={{ fontFamily: 'var(--font-heebo), serif' }}
      >
        {name}
      </h3>

      {/* Chef + storage */}
      <div className="flex items-center gap-1.5">
        {recipe.chefName && (
          <>
            <span className="w-4 h-4 rounded-full bg-[#2A4F3A] text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
              {recipe.chefName.charAt(0)}
            </span>
            <span className="text-[11px] text-[#A09893] truncate">{recipe.chefName}</span>
            <span className="text-[#E0D9CE] text-[10px]">·</span>
          </>
        )}
        <span className="text-[11px] text-[#A09893]">
          {recipe.storageDays} {t('recipe.days')} {locale === 'he' ? 'במקרר' : 'fridge'}
        </span>
      </div>
    </Link>
  );
}
