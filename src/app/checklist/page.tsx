'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { useLanguage } from '@/context/LanguageContext';
import { recipes } from '@/data/recipes';
import { Recipe, RecipeCategory, DietaryTag } from '@/types';
import { calculateShoppingList, mergeShoppingLists, groupByCategory, SHOPPING_CATEGORY_ORDER } from '@/lib/shoppingList';
import { scheduleMealPrep, estimateTotalMinutes, formatTimerMinutes } from '@/lib/mealPrepScheduler';
import { fetchProfile } from '@/lib/userDataApi';
import MealPrepSession from '@/components/recipes/MealPrepSession';
import { Beef, Leaf, Droplets, Wheat, Flame, ShoppingBag } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4;
type CategoryFilter = 'all' | 'recommended' | RecipeCategory;

interface StoredProfile {
  goal?: string;
  householdSize?: number;
  prepFrequency?: string;
  dietaryPrefs?: string[];
  estimatedSavings?: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PROTEIN_CATEGORIES: RecipeCategory[] = ['chicken', 'beef', 'fish'];
const SIDE_CATEGORIES: RecipeCategory[] = ['side', 'salad', 'tofu', 'breakfast'];

function getShoppingIcon(cat: string) {
  const props = { size: 14, strokeWidth: 1.75 };
  switch (cat) {
    case 'protein':    return <Beef {...props} />;
    case 'vegetables': return <Leaf {...props} />;
    case 'dairy':      return <Droplets {...props} />;
    case 'grains':     return <Wheat {...props} />;
    case 'spices':     return <Flame {...props} />;
    default:           return <ShoppingBag {...props} />;
  }
}

const SHOPPING_LABEL_HE: Record<string, string> = {
  protein: 'חלבונים', vegetables: 'ירקות', dairy: 'חלב',
  grains: 'דגנים', spices: 'תבלינים', other: 'שונות',
};

const CONFETTI_COLORS = ['#14422d', '#C9572A', '#5B7FA6', '#F7C948', '#8B5E3C'];

const slideVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
};

// ─── Utilities ──────────────────────────────────────────────────────────────

function getRecommendedRecipes(profile: StoredProfile | null, isExperienced: boolean): Recipe[] {
  const dietPrefs = profile?.dietaryPrefs ?? [];
  const filtered = dietPrefs.length > 0 && !dietPrefs.includes('none')
    ? recipes.filter(r => dietPrefs.some(p => r.dietaryTags?.includes(p as DietaryTag)))
    : recipes;
  const pool = filtered.length >= 2 ? filtered : recipes;

  const proteins = pool.filter(r => PROTEIN_CATEGORIES.includes(r.category as RecipeCategory));
  const sides    = pool.filter(r => SIDE_CATEGORIES.includes(r.category as RecipeCategory));

  if (isExperienced) {
    return [...proteins.slice(0, 2), ...sides.slice(0, 2)].slice(0, 4);
  }
  return [proteins[0], sides[0]].filter(Boolean);
}

function getLevel(xp: number, locale: string): string {
  if (locale === 'en') {
    if (xp < 100) return 'Beginner';
    if (xp < 300) return 'Intermediate';
    return 'Expert';
  }
  if (xp < 100) return 'מתחיל';
  if (xp < 300) return 'בינוני';
  return 'מומחה';
}

function padTwo(n: number) { return String(n).padStart(2, '0'); }

function toICSDate(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const [h, min] = timeStr.split(':');
  return `${y}${m}${d}T${h}${min}00`;
}

function openGoogleCalendar(
  type: 'shopping' | 'cooking',
  dateStr: string,
  timeStr: string,
  durationMin = 60
) {
  const dtstart = toICSDate(dateStr, timeStr);
  const end = new Date(`${dateStr}T${timeStr}:00`);
  end.setMinutes(end.getMinutes() + durationMin);
  const dtend = toICSDate(dateStr, `${padTwo(end.getHours())}:${padTwo(end.getMinutes())}`);

  const isShopping = type === 'shopping';
  const text = isShopping ? 'קניות לארוחות השבוע' : 'בישול מילפרפ שבועי';
  const details = isShopping
    ? 'קניות לפי רשימת המרכיבים — Easy PREP'
    : 'בישול מילפרפ שבועי — Easy PREP Nutrition';

  const url =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(text)}` +
    `&dates=${dtstart}/${dtend}` +
    `&details=${encodeURIComponent(details)}`;

  window.open(url, '_blank');
}

function printShoppingList(
  groupedItems: Record<string, import('@/types').ShoppingListEntry[]>,
  visibleCount: number,
  isHe: boolean,
  people: number,
  days: number,
  recipeNames: string[]
) {
  const iconMap: Record<string, string> = {
    protein: '🥩', vegetables: '🥦', dairy: '🥛', grains: '🌾', spices: '🧂', other: '🛒',
  };
  const labelMapHe: Record<string, string> = {
    protein: 'חלבונים', vegetables: 'ירקות', dairy: 'חלב', grains: 'דגנים', spices: 'תבלינים', other: 'שונות',
  };
  const catOrder = ['protein', 'vegetables', 'dairy', 'grains', 'spices', 'other'];

  const rows = catOrder
    .filter(cat => groupedItems[cat]?.length)
    .map(cat => {
      const items = groupedItems[cat]
        .map(item => {
          let qty = item.quantity;
          const rawUnit = item.unit;
          let displayUnit: string = rawUnit;
          if (rawUnit === 'g' && qty >= 1000) { qty = Math.round(qty / 100) / 10; displayUnit = isHe ? 'ק״ג' : 'kg'; }
          else if (rawUnit === 'ml' && qty >= 1000) { qty = Math.round(qty / 100) / 10; displayUnit = isHe ? 'ל׳' : 'L'; }
          else if (rawUnit === 'unit') displayUnit = '';
          const qtyStr = rawUnit === 'to_taste' ? (isHe ? 'לפי הטעם' : 'to taste') : qty > 0 ? `${qty}${displayUnit ? ' ' + displayUnit : ''}` : '';
          return `<div class="item"><span>${isHe ? item.nameHe : item.nameEn}</span><span class="qty">${qtyStr}</span></div>`;
        })
        .join('');
      const catLabel = isHe ? labelMapHe[cat] : cat;
      return `<div class="cat"><div class="cat-title">${iconMap[cat]} ${catLabel}</div>${items}</div>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html dir="${isHe ? 'rtl' : 'ltr'}" lang="${isHe ? 'he' : 'en'}">
<head>
<meta charset="UTF-8">
<title>${isHe ? 'רשימת קניות' : 'Shopping List'}</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; padding: 28px 36px; color: #1a1c1b; max-width: 600px; }
  h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
  .meta { color: #6B6560; font-size: 13px; margin: 0 0 6px; }
  .recipes { font-size: 12px; color: #A09893; margin: 0 0 20px; }
  .cat { margin-bottom: 18px; }
  .cat-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #A09893; letter-spacing: 0.06em; margin-bottom: 6px; }
  .item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0ebe3; font-size: 13px; }
  .qty { font-weight: 700; color: #14422d; }
  .footer { margin-top: 24px; font-size: 11px; color: #A09893; border-top: 1px solid #E0D9CE; padding-top: 10px; }
  @media print { @page { margin: 18mm; } body { padding: 0; } }
</style>
</head>
<body>
<h1>${isHe ? '🛒 רשימת קניות' : '🛒 Shopping List'}</h1>
<p class="meta">${isHe ? `${people} אנשים · ${days} ימים · ${visibleCount} פריטים` : `${people} people · ${days} days · ${visibleCount} items`}</p>
<p class="recipes">${recipeNames.join(' · ')}</p>
${rows}
<p class="footer">Easy PREP Nutrition</p>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }
}

/** Returns display string like "2 ק״ג", "500 גר׳", "3 כוסות" */
function formatQty(qty: number, unit: string, isHe: boolean): string {
  if (unit === 'to_taste') return isHe ? 'לפי הטעם' : 'to taste';
  if (qty <= 0) return '';
  if (unit === 'g' && qty >= 1000) {
    const kg = Math.round(qty / 100) / 10;
    return `${kg} ${isHe ? 'ק״ג' : 'kg'}`;
  }
  if (unit === 'ml' && qty >= 1000) {
    const l = Math.round(qty / 100) / 10;
    return `${l} ${isHe ? 'ל׳' : 'L'}`;
  }
  if (unit === 'unit') return String(qty);
  const unitLabels: Record<string, [string, string]> = {
    g: ["גר׳", 'g'], kg: ['ק״ג', 'kg'], ml: ['מ״ל', 'ml'],
    cup: ['כוס', 'cup'], tbsp: ['כף', 'tbsp'], tsp: ['כפית', 'tsp'],
    can: ['פחית', 'can'], pinch: ['קורט', 'pinch'],
  };
  const label = unitLabels[unit]?.[isHe ? 0 : 1] ?? unit;
  return `${qty} ${label}`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ConfettiBurst() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    distance: 80 + i * 6,
  }));

  return (
    <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 16px' }}>
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: Math.cos(rad) * p.distance, y: Math.sin(rad) * p.distance, scale: 0, opacity: 0 }}
            transition={{ duration: 0.9, delay: i * 0.04, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 8, height: 8, marginTop: -4, marginLeft: -4,
              borderRadius: i % 2 === 0 ? '50%' : 2,
              background: p.color,
            }}
          />
        );
      })}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 40,
      }}>🎉</div>
    </div>
  );
}

interface WizardRecipeCardProps {
  recipe: Recipe;
  isSelected: boolean;
  isRecommended: boolean;
  isHe: boolean;
  onToggle: () => void;
}

function WizardRecipeCard({ recipe, isSelected, isRecommended, isHe, onToggle }: WizardRecipeCardProps) {
  const name = isHe ? recipe.nameHe : recipe.nameEn;
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      style={{
        background: isSelected ? '#EBF2ED' : '#fff',
        border: `2px solid ${isSelected ? '#14422d' : '#E0D9CE'}`,
        borderRadius: 14, overflow: 'hidden',
        cursor: 'pointer', textAlign: 'right', padding: 0,
        position: 'relative', transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {isRecommended && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 2,
          background: '#14422d', color: '#fff',
          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 9999,
        }}>
          ✦ המלצה
        </div>
      )}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 2,
          width: 22, height: 22, borderRadius: '50%',
          background: '#14422d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <div style={{ position: 'relative', height: 100 }}>
        <Image src={recipe.image} alt={name} fill sizes="200px" style={{ objectFit: 'cover' }} />
      </div>
      <div style={{ padding: '8px 10px' }}>
        <p style={{
          fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
          lineHeight: 1.3, margin: '0 0 4px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{name}</p>
        <p style={{ fontSize: 10, color: 'rgba(26,25,24,0.45)', margin: 0 }}>
          {recipe.prepTimeMin + recipe.cookTimeMin} דק׳
        </p>
      </div>
    </motion.button>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: 8, borderRadius: 9999,
            transition: 'all 0.3s',
            width: i + 1 === current ? 28 : 8,
            background: i + 1 === current ? '#14422d' : i + 1 < current ? '#a0c4b0' : '#E0D9CE',
          }}
        />
      ))}
    </div>
  );
}

function CountStepper({
  value, onChange, min = 1, max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-surface)' }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ padding: '8px 14px', border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#14422d', fontWeight: 700 }}
      >−</button>
      <span style={{ fontSize: 16, fontWeight: 700, minWidth: 28, textAlign: 'center', color: 'var(--text-primary)' }}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ padding: '8px 14px', border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#14422d', fontWeight: 700 }}
      >+</button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function MealPrepPlannerPage() {
  const { locale, t } = useLanguage();
  const isHe = locale === 'he';
  const { isSignedIn, isLoaded } = useAuth();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(5);
  const [haveAtHome, setHaveAtHome] = useState<Set<string>>(new Set());
  const [shoppingDate, setShoppingDate] = useState('');
  const [shoppingTime, setShoppingTime] = useState('10:00');
  const [cookingDate, setCookingDate] = useState('');
  const [cookingTime, setCookingTime] = useState('10:00');
  const [xp, setXp] = useState(0);
  const [wizardCount, setWizardCount] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const xpAwardedRef = useRef(false);

  // Load profile + XP from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('easyprep_profile');
      if (raw) {
        const p = JSON.parse(raw) as StoredProfile;
        setProfile(p);
        if (p.householdSize) setPeople(p.householdSize);
      }
    } catch {}
    try {
      setXp(Number(localStorage.getItem('easyprep_xp') ?? '0'));
      setWizardCount(Number(localStorage.getItem('easyprep_wizard_completed') ?? '0'));
    } catch {}
  }, []);

  // Override with Supabase if signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchProfile().then(p => {
      if (p) {
        const sp = p as StoredProfile;
        setProfile(sp);
        if (sp.householdSize) setPeople(sp.householdSize);
        try { localStorage.setItem('easyprep_profile', JSON.stringify(sp)); } catch {}
      }
    }).catch(() => {});
  }, [isSignedIn, isLoaded]);

  const isExperienced = profile?.prepFrequency === '3-5' || profile?.prepFrequency === 'always';

  const recommendedIds = useMemo(
    () => new Set(getRecommendedRecipes(profile, isExperienced).map(r => r.id)),
    [profile, isExperienced]
  );

  // Pre-select recommended recipes on first load
  useEffect(() => {
    if (selectedRecipeIds.size > 0) return;
    setSelectedRecipeIds(new Set(recommendedIds));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedIds]);

  const selectedRecipes = useMemo(
    () => recipes.filter(r => selectedRecipeIds.has(r.id)),
    [selectedRecipeIds]
  );

  // Category filter options
  const filterOptions: { value: CategoryFilter; labelHe: string; labelEn: string }[] = [
    { value: 'all',        labelHe: 'הכל',         labelEn: 'All' },
    { value: 'recommended', labelHe: 'המלצה',       labelEn: 'Recommended' },
    { value: 'chicken',    labelHe: 'עוף',          labelEn: 'Chicken' },
    { value: 'beef',       labelHe: 'בקר',          labelEn: 'Beef' },
    { value: 'fish',       labelHe: 'דגים',         labelEn: 'Fish' },
    { value: 'side',       labelHe: 'תוספות',       labelEn: 'Sides' },
    { value: 'salad',      labelHe: 'סלטים',        labelEn: 'Salads' },
    { value: 'breakfast',  labelHe: 'ארוחת בוקר',   labelEn: 'Breakfast' },
    { value: 'tofu',       labelHe: 'טופו',         labelEn: 'Tofu' },
  ];

  const filteredRecipes = useMemo(() => {
    if (categoryFilter === 'all') return recipes;
    if (categoryFilter === 'recommended') return recipes.filter(r => r.tags.includes('recommended'));
    return recipes.filter(r => r.category === categoryFilter);
  }, [categoryFilter]);

  // Shopping list scaled by people × days
  const shoppingListItems = useMemo(() => {
    return mergeShoppingLists(
      selectedRecipes.map(r => calculateShoppingList(r, people))
    );
  }, [selectedRecipes, people]);

  const visibleShoppingItems = useMemo(
    () => shoppingListItems.filter(item => !haveAtHome.has(`${item.nameHe}__${item.unit}`)),
    [shoppingListItems, haveAtHome]
  );

  const shoppingTimeEst = useMemo(() => {
    const raw = Math.max(30, visibleShoppingItems.length * 1.5);
    return Math.ceil(raw / 15) * 15;
  }, [visibleShoppingItems]);

  const cookingSchedule = useMemo(() => scheduleMealPrep(selectedRecipes), [selectedRecipes]);
  const estimatedCookMin = useMemo(() => estimateTotalMinutes(cookingSchedule), [cookingSchedule]);

  const storageDaysWarning = useMemo(() => {
    if (!shoppingDate || !cookingDate) return false;
    const diff = (new Date(cookingDate).getTime() - new Date(shoppingDate).getTime()) / 86400000;
    return diff > 3;
  }, [shoppingDate, cookingDate]);

  const grouped = groupByCategory(shoppingListItems);
  const groupedVisible = groupByCategory(visibleShoppingItems);

  // Award XP on step 4
  useEffect(() => {
    if (currentStep !== 4 || xpAwardedRef.current) return;
    xpAwardedRef.current = true;
    const isNew = wizardCount === 0;
    const earned = isNew ? 50 : 30;
    setXp(prev => {
      const total = prev + earned;
      try { localStorage.setItem('easyprep_xp', String(total)); } catch {}
      return total;
    });
    try {
      const prev = Number(localStorage.getItem('easyprep_wizard_completed') ?? '0');
      localStorage.setItem('easyprep_wizard_completed', String(prev + 1));
      setWizardCount(prev + 1);
    } catch {}
  }, [currentStep, wizardCount]);

  function goNext() {
    setDirection(1);
    setCurrentStep(s => (s + 1) as WizardStep);
  }
  function goBack() {
    setDirection(-1);
    setCurrentStep(s => (s - 1) as WizardStep);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div dir={isHe ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 id="tour-checklist-title" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            {isHe ? 'תכנון מילפרפ שבועי' : 'Weekly Meal Prep Planner'}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.5)', margin: 0 }}>
            {isHe ? 'נלווה אותך צעד אחר צעד' : "We'll guide you step by step"}
          </p>
        </div>

        <StepDots current={currentStep} total={4} />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >

            {/* ── Step 1: Recipe Selection ── */}
            {currentStep === 1 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {t('wizard.checklist.step1.title')}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.5)', marginBottom: 14 }}>
                  {isHe
                    ? isExperienced
                      ? 'כמנוסה — המלצנו על 2 חלבונים ו-2 תוספות. שנה לפי טעמך.'
                      : 'למתחיל — המלצנו על חלבון אחד ותוספת אחת. פשוט ויעיל!'
                    : isExperienced
                      ? 'As an experienced prepper — we recommended 2 proteins & 2 sides.'
                      : 'As a beginner — we recommended 1 protein & 1 side. Simple and effective!'}
                </p>

                {/* Category filter pills */}
                <div style={{
                  display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
                  marginBottom: 16, WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                }}>
                  {filterOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCategoryFilter(opt.value)}
                      style={{
                        flexShrink: 0,
                        padding: '6px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${categoryFilter === opt.value ? '#14422d' : '#E0D9CE'}`,
                        background: categoryFilter === opt.value ? '#14422d' : '#fff',
                        color: categoryFilter === opt.value ? '#fff' : '#6B6560',
                        cursor: 'pointer', transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isHe ? opt.labelHe : opt.labelEn}
                    </button>
                  ))}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 10, marginBottom: 24,
                }}>
                  {filteredRecipes.map(recipe => (
                    <WizardRecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isSelected={selectedRecipeIds.has(recipe.id)}
                      isRecommended={recommendedIds.has(recipe.id)}
                      isHe={isHe}
                      onToggle={() => {
                        setSelectedRecipeIds(prev => {
                          const next = new Set(prev);
                          next.has(recipe.id) ? next.delete(recipe.id) : next.add(recipe.id);
                          return next;
                        });
                      }}
                    />
                  ))}
                  {filteredRecipes.length === 0 && (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'rgba(26,25,24,0.4)', fontSize: 14, padding: '24px 0' }}>
                      {isHe ? 'אין מתכונים בקטגוריה זו' : 'No recipes in this category'}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(26,25,24,0.45)' }}>
                    {selectedRecipeIds.size > 0
                      ? (isHe ? `${selectedRecipeIds.size} נבחרו` : `${selectedRecipeIds.size} selected`)
                      : (isHe ? 'בחר לפחות מתכון אחד' : 'Select at least one recipe')}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={selectedRecipeIds.size === 0}
                    style={{
                      padding: '12px 28px', borderRadius: 9999,
                      background: selectedRecipeIds.size === 0 ? '#c0c9c1' : '#14422d',
                      color: '#fff', fontSize: 14, fontWeight: 600,
                      border: 'none', cursor: selectedRecipeIds.size === 0 ? 'default' : 'pointer',
                    }}
                  >
                    {t('wizard.checklist.step1.continue')} ←
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Shopping Planning ── */}
            {currentStep === 2 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {t('wizard.checklist.step2.title')}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.5)', marginBottom: 16 }}>
                  {isHe ? 'ספר לנו עבור מי אתה מבשל' : 'Tell us who you\'re cooking for'}
                </p>

                {/* People + Days selectors */}
                <div style={{
                  background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)',
                  padding: '16px', marginBottom: 16,
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
                }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6B6560', margin: '0 0 8px' }}>
                      {isHe ? '👤 עבור כמה אנשים?' : '👤 How many people?'}
                    </p>
                    <CountStepper value={people} onChange={setPeople} min={1} max={12} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#6B6560', margin: '0 0 8px' }}>
                      {isHe ? '📅 לכמה ימים?' : '📅 How many days?'}
                    </p>
                    <CountStepper value={days} onChange={setDays} min={1} max={7} />
                  </div>
                </div>

                {/* Time estimate pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#EBF2ED', borderRadius: 9999, padding: '6px 14px',
                  }}>
                    <span style={{ fontSize: 16 }}>🛒</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#14422d' }}>
                      ~{shoppingTimeEst} {t('wizard.checklist.step2.timeEstimate')}
                    </span>
                  </div>
                  {haveAtHome.size > 0 && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#F0EBE3', borderRadius: 9999, padding: '6px 14px',
                    }}>
                      <span style={{ fontSize: 13, color: '#6B6560' }}>
                        {isHe ? `✓ ${haveAtHome.size} יש בבית` : `✓ ${haveAtHome.size} at home`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Shopping list with "יש בבית" checkboxes */}
                <div style={{
                  background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)',
                  padding: '12px 16px', marginBottom: 20,
                  maxHeight: 280, overflowY: 'auto',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#A09893', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {isHe ? 'רשימת הקניות — סמן מה יש לך כבר בבית' : 'Shopping List — check what you already have'}
                  </p>
                  {SHOPPING_CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#A09893', margin: '0 0 6px', textTransform: 'uppercase' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{getShoppingIcon(cat)} {isHe ? SHOPPING_LABEL_HE[cat] : cat}</span>
                      </p>
                      {grouped[cat].map((item) => {
                        const itemKey = `${item.nameHe}__${item.unit}`;
                        const atHome = haveAtHome.has(itemKey);
                        return (
                          <label
                            key={itemKey}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '5px 0', cursor: 'pointer',
                              opacity: atHome ? 0.45 : 1,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={atHome}
                              onChange={() => {
                                setHaveAtHome(prev => {
                                  const next = new Set(prev);
                                  atHome ? next.delete(itemKey) : next.add(itemKey);
                                  return next;
                                });
                              }}
                              style={{ accentColor: '#14422d', width: 15, height: 15, flexShrink: 0 }}
                            />
                            <span style={{
                              fontSize: 12, color: 'var(--text-primary)', flex: 1,
                              textDecoration: atHome ? 'line-through' : 'none',
                            }}>
                              {isHe ? item.nameHe : item.nameEn}
                            </span>
                            {item.unit !== 'to_taste' && item.quantity > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#14422d', flexShrink: 0 }}>
                                {formatQty(item.quantity, item.unit, isHe)}
                              </span>
                            )}
                            {atHome && (
                              <span style={{ fontSize: 10, color: '#14422d', flexShrink: 0 }}>
                                {isHe ? 'יש בבית' : 'at home'}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Show visible (still needed) count */}
                {haveAtHome.size > 0 && (
                  <p style={{ fontSize: 12, color: '#6B6560', margin: '0 0 12px' }}>
                    {isHe
                      ? `צריך לקנות: ${visibleShoppingItems.length} פריטים`
                      : `Need to buy: ${visibleShoppingItems.length} items`}
                  </p>
                )}

                {/* Date/time picker */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '16px', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px' }}>
                    {t('wizard.checklist.step2.shoppingDate')}
                  </p>
                  <div dir="ltr" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      value={shoppingDate}
                      min={todayStr}
                      onChange={e => setShoppingDate(e.target.value)}
                      style={{
                        flex: 1, padding: '9px 12px', borderRadius: 10,
                        border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg-page)',
                        minWidth: 140,
                      }}
                    />
                    <input
                      type="time"
                      value={shoppingTime}
                      onChange={e => setShoppingTime(e.target.value)}
                      style={{
                        width: 110, padding: '9px 12px', borderRadius: 10,
                        border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg-page)',
                      }}
                    />
                  </div>
                </div>

                {/* Calendar + Print buttons */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                  <button
                    onClick={() => shoppingDate && openGoogleCalendar('shopping', shoppingDate, shoppingTime, shoppingTimeEst)}
                    disabled={!shoppingDate}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 16px', borderRadius: 12,
                      background: shoppingDate ? '#1a1c1b' : '#c0c9c1',
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: shoppingDate ? 'pointer' : 'default',
                      justifyContent: 'center',
                    }}
                  >
                    📅 {isHe ? 'הוסף ליומן גוגל' : 'Add to Google Calendar'}
                  </button>
                  <button
                    onClick={() => printShoppingList(
                      groupedVisible,
                      visibleShoppingItems.length,
                      isHe,
                      people,
                      days,
                      selectedRecipes.map(r => isHe ? r.nameHe : r.nameEn)
                    )}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '12px 16px', borderRadius: 12,
                      background: '#F0EBE3', color: '#6B6560',
                      fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🖨️ {isHe ? 'הדפס' : 'Print'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={goBack} style={backBtnStyle}>{isHe ? '→ חזרה' : '← Back'}</button>
                  <button onClick={goNext} style={nextBtnStyle}>{isHe ? 'המשך לבישול ←' : 'Continue →'}</button>
                </div>
              </div>
            )}

            {/* ── Step 3: Cooking Planning ── */}
            {currentStep === 3 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {t('wizard.checklist.step3.title')}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.5)', marginBottom: 16 }}>
                  {isHe
                    ? `${selectedRecipes.length} מתכונים · ${people} ${people === 1 ? 'אדם' : 'אנשים'} · ${days} ימים`
                    : `${selectedRecipes.length} recipes · ${people} ${people === 1 ? 'person' : 'people'} · ${days} days`}
                </p>

                {/* Cook time estimate */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#FBF0EB', borderRadius: 9999, padding: '6px 14px',
                  marginBottom: storageDaysWarning ? 10 : 16,
                }}>
                  <span style={{ fontSize: 16 }}>🍳</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#C9572A' }}>
                    ~{formatTimerMinutes(estimatedCookMin)} {isHe ? 'בישול' : 'cooking'}
                  </span>
                </div>

                {/* Storage warning */}
                {storageDaysWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      background: '#FBF0EB', border: '1px solid #F0C4A8',
                      borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                    <p style={{ fontSize: 12, color: '#8B3A1A', margin: 0, lineHeight: 1.5 }}>
                      {t('wizard.checklist.step3.storageWarning')}
                    </p>
                  </motion.div>
                )}

                {/* Selected recipes list */}
                <div style={{
                  background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)',
                  padding: '12px 16px', marginBottom: 20,
                }}>
                  {selectedRecipes.map((r, i) => (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 0',
                      borderBottom: i < selectedRecipes.length - 1 ? '1px solid #f0ebe3' : 'none',
                    }}>
                      <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        <Image src={r.image} alt="" fill sizes="36px" style={{ objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          {isHe ? r.nameHe : r.nameEn}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(26,25,24,0.45)', margin: 0 }}>
                          {r.prepTimeMin + r.cookTimeMin} {isHe ? 'דק׳' : 'min'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Date/time picker */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '16px', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px' }}>
                    {t('wizard.checklist.step3.cookingDate')}
                  </p>
                  <div dir="ltr" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      value={cookingDate}
                      min={shoppingDate || todayStr}
                      onChange={e => setCookingDate(e.target.value)}
                      style={{
                        flex: 1, padding: '9px 12px', borderRadius: 10,
                        border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg-page)',
                        minWidth: 140,
                      }}
                    />
                    <input
                      type="time"
                      value={cookingTime}
                      onChange={e => setCookingTime(e.target.value)}
                      style={{
                        width: 110, padding: '9px 12px', borderRadius: 10,
                        border: '1px solid var(--border)', fontSize: 14, background: 'var(--bg-page)',
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => cookingDate && openGoogleCalendar('cooking', cookingDate, cookingTime, estimatedCookMin)}
                  disabled={!cookingDate}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '12px 20px', borderRadius: 12, marginBottom: 24,
                    background: cookingDate ? '#1a1c1b' : '#c0c9c1',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: cookingDate ? 'pointer' : 'default',
                    justifyContent: 'center',
                  }}
                >
                  📅 {isHe ? 'הוסף ליומן גוגל' : 'Add to Google Calendar'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={goBack} style={backBtnStyle}>{isHe ? '→ חזרה' : '← Back'}</button>
                  <button onClick={goNext} style={nextBtnStyle}>{isHe ? 'סיום ←' : 'Finish →'}</button>
                </div>
              </div>
            )}

            {/* ── Step 4: Celebration ── */}
            {currentStep === 4 && (
              <div style={{ textAlign: 'center' }}>
                <ConfettiBurst />

                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {t('wizard.checklist.step4.title')}
                </h2>

                {/* XP badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
                    style={{
                      background: '#14422d', color: '#fff',
                      borderRadius: 9999, padding: '6px 16px',
                      fontSize: 14, fontWeight: 700,
                    }}
                  >
                    {wizardCount <= 1
                      ? t('wizard.checklist.step4.xpNew')
                      : t('wizard.checklist.step4.xpReturn')}
                  </motion.div>
                  <div style={{
                    background: '#F0EBE3', borderRadius: 9999, padding: '6px 14px',
                    fontSize: 13, fontWeight: 600, color: '#6B6560',
                  }}>
                    {getLevel(xp, locale)} · {xp} XP
                  </div>
                </div>

                {/* Summary card */}
                <div style={{
                  background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)',
                  padding: '20px', marginBottom: 24, textAlign: isHe ? 'right' : 'left',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#A09893', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t('wizard.checklist.step4.summary')}
                  </p>

                  {/* People + days summary */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ background: '#EBF2ED', borderRadius: 9999, padding: '4px 12px', fontSize: 12, color: '#14422d', fontWeight: 600 }}>
                      👤 {people} {isHe ? (people === 1 ? 'אדם' : 'אנשים') : (people === 1 ? 'person' : 'people')}
                    </div>
                    <div style={{ background: '#EBF2ED', borderRadius: 9999, padding: '4px 12px', fontSize: 12, color: '#14422d', fontWeight: 600 }}>
                      📅 {days} {isHe ? 'ימים' : 'days'}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    {selectedRecipes.map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ position: 'relative', width: 28, height: 28, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                          <Image src={r.image} alt="" fill sizes="28px" style={{ objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{isHe ? r.nameHe : r.nameEn}</span>
                      </div>
                    ))}
                  </div>

                  {(shoppingDate || cookingDate) && (
                    <div style={{ borderTop: '1px solid #F0EBE3', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {shoppingDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }}>🛒</span>
                          <span style={{ fontSize: 12, color: '#6B6560' }}>
                            {isHe ? 'קניות:' : 'Shopping:'} {shoppingDate} {shoppingTime}
                          </span>
                        </div>
                      )}
                      {cookingDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }}>🍳</span>
                          <span style={{ fontSize: 12, color: '#6B6560' }}>
                            {isHe ? 'בישול:' : 'Cooking:'} {cookingDate} {cookingTime}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSessionActive(true)}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 14,
                    background: '#14422d', color: '#fff',
                    fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                    marginBottom: 12,
                  }}
                >
                  🍳 {t('wizard.checklist.step4.startCooking')}
                </button>

                <button
                  onClick={() => {
                    xpAwardedRef.current = false;
                    setDirection(-1);
                    setCurrentStep(1);
                    setSelectedRecipeIds(new Set(recommendedIds));
                    setShoppingDate('');
                    setCookingDate('');
                    setHaveAtHome(new Set());
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'rgba(26,25,24,0.45)',
                  }}
                >
                  {isHe ? 'תכנן מילפרפ חדש' : 'Plan a new meal prep'}
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {sessionActive && (
          <MealPrepSession
            selectedRecipes={selectedRecipes}
            onClose={() => setSessionActive(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  padding: '11px 20px', borderRadius: 9999,
  background: '#F0EBE3', border: 'none',
  fontSize: 13, fontWeight: 600, color: '#6B6560', cursor: 'pointer',
};

const nextBtnStyle: React.CSSProperties = {
  padding: '11px 24px', borderRadius: 9999,
  background: '#14422d', border: 'none',
  fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
};
