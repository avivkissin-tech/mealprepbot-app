'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { use, useState, useEffect } from 'react';
import { getRecipeById } from '@/data/recipes';
import { useLanguage } from '@/context/LanguageContext';
import IngredientList from '@/components/recipes/IngredientList';
import StepByStep from '@/components/recipes/StepByStep';
import PortionSelector from '@/components/recipes/PortionSelector';
import { DietaryTag } from '@/types';

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

const DIETARY_BADGE: Record<DietaryTag, { he: string; en: string; bg: string; color: string }> = {
  'vegan':        { he: 'טבעוני',      en: 'Vegan',        bg: 'rgba(20,66,45,0.10)',   color: '#14422d' },
  'vegetarian':   { he: 'צמחוני',      en: 'Veggie',       bg: 'rgba(20,66,45,0.10)',   color: '#14422d' },
  'gluten-free':  { he: 'ללא גלוטן',   en: 'Gluten-Free',  bg: 'rgba(201,87,42,0.10)',  color: '#c9572a' },
  'dairy-free':   { he: 'ללא חלב',     en: 'Dairy-Free',   color: '#3d6b8a',            bg: 'rgba(91,127,166,0.12)' },
  'high-protein': { he: 'עשיר בחלבון', en: 'High-Protein', bg: 'rgba(201,87,42,0.10)',  color: '#c9572a' },
  'low-carb':     { he: 'דל פחמימות',  en: 'Low-Carb',     bg: 'rgba(113,121,115,0.12)', color: '#414943' },
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
  const totalMin = recipe.prepTimeMin + recipe.cookTimeMin;
  const nutrition = recipe.nutritionPerServing;

  return (
    <div dir="rtl" style={{ background: '#faf9f7', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Back */}
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: '#717973', textDecoration: 'none',
            marginBottom: 28, fontWeight: 500,
          }}
        >
          ← {t('recipe.backToRecipes')}
        </Link>

        {/* ── Hero + Side Panel grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 28,
        }}
          className="lg:recipe-grid"
        >
          {/* Hero image — full width on mobile, 7/12 on desktop */}
          <div style={{ gridColumn: '1', position: 'relative' }}>
            <div style={{
              position: 'relative', borderRadius: 24, overflow: 'hidden',
              aspectRatio: '16/9',
              boxShadow: '0 8px 32px rgba(45,90,67,0.05)',
            }}>
              <Image
                src={recipe.image}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 700px"
                priority
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(20,66,45,0.45) 0%, transparent 55%)',
              }} />
              {/* Category badge on image */}
              {recipe.dietaryTags?.[0] && (() => {
                const b = DIETARY_BADGE[recipe.dietaryTags![0]];
                return (
                  <span style={{
                    position: 'absolute', top: 16, right: 16,
                    fontSize: 12, fontWeight: 600,
                    padding: '4px 12px', borderRadius: 9999,
                    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
                    color: b.color,
                  }}>
                    {locale === 'he' ? b.he : b.en}
                  </span>
                );
              })()}
              {/* Title overlay */}
              <div style={{
                position: 'absolute', bottom: 0, right: 0, left: 0,
                padding: '32px 28px 24px',
              }}>
                <h1 style={{
                  fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700,
                  color: '#ffffff', lineHeight: 1.25, margin: 0,
                  textShadow: '0 2px 12px rgba(0,0,0,0.2)',
                }}>
                  {name}
                </h1>
              </div>
            </div>

            {/* Description below image */}
            <p style={{ fontSize: 15, color: '#414943', lineHeight: 1.7, margin: '20px 4px 0' }}>
              {description}
            </p>
          </div>

          {/* Side panel */}
          <div style={{ gridColumn: '1' }}>
            <div style={{
              background: '#ffffff', borderRadius: 24,
              padding: 28, boxShadow: '0 8px 32px rgba(45,90,67,0.05)',
              position: 'sticky', top: 80,
            }}>

              {/* Quick stats row */}
              <div style={{
                display: 'flex', justifyContent: 'space-around',
                paddingBottom: 20, marginBottom: 20,
                borderBottom: '1px solid #efeeec',
              }}>
                {[
                  { icon: '⏱', label: t('recipe.prepTime'), value: `${totalMin} ${t('recipe.minutes')}` },
                  { icon: '🍽️', label: t('recipe.servings'), value: `${recipe.baseServings}` },
                  ...(nutrition ? [{ icon: '🔥', label: t('nutrition.calories'), value: `${nutrition.calories}` }] : []),
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1c1b' }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: '#717973', marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Nutrition grid */}
              {nutrition && (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8, marginBottom: 24,
                }}>
                  {[
                    { label: locale === 'he' ? 'קל׳' : 'Kcal', value: nutrition.calories },
                    { label: locale === 'he' ? 'חלבון' : 'Protein', value: `${nutrition.protein}g` },
                    { label: locale === 'he' ? 'פחמ׳' : 'Carbs', value: `${nutrition.carbs}g` },
                    { label: locale === 'he' ? 'שומן' : 'Fat', value: `${nutrition.fat}g` },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: 'rgba(20,66,45,0.06)',
                      borderRadius: 12, padding: '10px 8px', textAlign: 'center',
                      border: '1px solid rgba(20,66,45,0.08)',
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#14422d' }}>{item.value}</div>
                      <div style={{ fontSize: 10, color: '#717973', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chef */}
              {recipe.chefName && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #efeeec',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#14422d', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {recipe.chefName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#717973' }}>שף מארגן</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1c1b' }}>{recipe.chefName}</div>
                  </div>
                </div>
              )}

              {/* Cooked today button */}
              <button
                onClick={handleMarkCooked}
                disabled={cookedToday}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 16,
                  background: cookedToday ? '#efeeec' : '#14422d',
                  color: cookedToday ? '#717973' : '#ffffff',
                  fontSize: 15, fontWeight: 700, border: 'none',
                  cursor: cookedToday ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s',
                }}
              >
                {cookedToday
                  ? (justMarked ? '✓ נרשם! כל הכבוד' : '✓ הכנת היום')
                  : 'הכנתי היום'}
              </button>

              {/* Storage */}
              <p style={{
                textAlign: 'center', marginTop: 12,
                fontSize: 12, color: '#717973',
              }}>
                📦 שמור עד {recipe.storageDays} {t('recipe.days')} בקירור
              </p>
            </div>
          </div>
        </div>

        {/* ── Ingredients + Steps ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr',
          gap: 40, marginTop: 48,
        }}
          className="lg:recipe-bottom-grid"
        >
          {/* Ingredients */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#14422d', marginBottom: 20 }}>
              {t('recipe.ingredients')}
            </h2>
            <div style={{
              background: '#ffffff', borderRadius: 20, padding: 24,
              boxShadow: '0 8px 32px rgba(45,90,67,0.05)',
            }}>
              <IngredientList
                ingredients={recipe.ingredients}
                portions={recipe.baseServings}
                baseServings={recipe.baseServings}
              />
            </div>
            <div style={{ marginTop: 20 }}>
              <PortionSelector recipeId={recipe.id} baseServings={recipe.baseServings} />
            </div>
          </div>

          {/* Steps */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#14422d', marginBottom: 20 }}>
              {t('recipe.steps')}
            </h2>
            <div style={{
              background: '#ffffff', borderRadius: 20, padding: 24,
              boxShadow: '0 8px 32px rgba(45,90,67,0.05)',
            }}>
              <StepByStep steps={recipe.steps} />
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg\\:recipe-grid {
            grid-template-columns: 7fr 5fr !important;
          }
          .lg\\:recipe-grid > *:first-child { grid-column: 1; }
          .lg\\:recipe-grid > *:last-child  { grid-column: 2; }
          .lg\\:recipe-bottom-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
