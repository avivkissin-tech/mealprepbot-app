'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Recipe, DietaryTag } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useMealPlan } from '@/context/MealPlanContext';

export const DIETARY_BADGE: Record<DietaryTag, { he: string; en: string; bg: string; color: string }> = {
  'vegan':        { he: 'טבעוני',      en: 'Vegan',        bg: 'rgba(20,66,45,0.12)',  color: '#14422d' },
  'vegetarian':   { he: 'צמחוני',      en: 'Veggie',       bg: 'rgba(20,66,45,0.12)',  color: '#14422d' },
  'gluten-free':  { he: 'ללא גלוטן',   en: 'Gluten-Free',  bg: 'rgba(201,87,42,0.10)', color: '#c9572a' },
  'dairy-free':   { he: 'ללא חלב',     en: 'Dairy-Free',   bg: 'rgba(91,127,166,0.12)', color: '#3d6b8a' },
  'high-protein': { he: 'עשיר בחלבון', en: 'High-Protein', bg: 'rgba(201,87,42,0.10)', color: '#c9572a' },
  'low-carb':     { he: 'דל פחמימות',  en: 'Low-Carb',     bg: 'rgba(113,121,115,0.12)', color: '#414943' },
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
  const nutrition = recipe.nutritionPerServing;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group block flex-shrink-0 snap-start"
      style={{ width: 240 }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(45,90,67,0.05)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(45,90,67,0.10)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(45,90,67,0.05)';
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
          <Image
            src={recipe.image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="240px"
          />
          {/* Bottom gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(20,66,45,0.35) 0%, transparent 55%)',
          }} />
          {/* Dietary badge on image */}
          {badge && (
            <span style={{
              position: 'absolute', top: 10, right: 10,
              fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 9999,
              background: badge.bg, color: badge.color,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${badge.bg}`,
            }}>
              {locale === 'he' ? badge.he : badge.en}
            </span>
          )}
          {/* Add to plan button */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleRecipe(recipe.id); }}
            aria-label={selected ? 'Remove from plan' : 'Add to plan'}
            style={{
              position: 'absolute', bottom: 10, left: 10,
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
              transition: 'all 0.15s',
              background: selected ? '#14422d' : 'rgba(255,255,255,0.92)',
              color: selected ? '#ffffff' : '#14422d',
              boxShadow: '0 2px 8px rgba(20,66,45,0.15)',
            }}
          >
            {selected ? '✓' : '+'}
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px 16px' }}>
          {/* Time badge */}
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#717973',
              background: '#efeeec', padding: '2px 8px', borderRadius: 9999,
            }}>
              {totalMin} {t('recipe.minutes')}
            </span>
            {recipe.storageDays && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#717973',
                background: '#efeeec', padding: '2px 8px', borderRadius: 9999,
              }}>
                {recipe.storageDays}d {locale === 'he' ? 'מקרר' : 'fridge'}
              </span>
            )}
          </div>

          {/* Name */}
          <h3 style={{
            fontSize: 14, fontWeight: 700, color: '#1a1c1b',
            lineHeight: 1.4, marginBottom: nutrition ? 10 : 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}>
            {name}
          </h3>

          {/* Nutrition row */}
          {nutrition && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 4, marginTop: 10,
              paddingTop: 10, borderTop: '1px solid #efeeec',
            }}>
              {[
                { label: locale === 'he' ? 'קל׳' : 'kcal', value: nutrition.calories },
                { label: locale === 'he' ? 'חלב׳' : 'prot', value: `${nutrition.protein}g` },
                { label: locale === 'he' ? 'פחמ׳' : 'carb', value: `${nutrition.carbs}g` },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#14422d' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: '#717973', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
