'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { recipes } from '@/data/recipes';
import { useUser, useAuth } from '@clerk/nextjs';
import { useSaved } from '@/context/SavedContext';
import { fetchCookHistory, fetchPlanner, fetchProfile } from '@/lib/userDataApi';
import { Clock } from 'lucide-react';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton';
import RecipeImageFallback from '@/components/ui/RecipeImageFallback';

/* ─── Types ──────────────────────────────────────────────── */
type UserState = 'new' | 'has-plan' | 'active' | 'returning';

interface UserProfile {
  goal?: string;
  dietaryPrefs?: string[];
}

/* ─── Helpers ────────────────────────────────────────────── */
const STORAGE_KEY_PLANNER = 'easyprep_planner';
const STORAGE_KEY_HISTORY = 'easyprep_cook_history';

function loadProfile(): UserProfile | null {
  try { return JSON.parse(localStorage.getItem('easyprep_profile') ?? 'null'); }
  catch { return null; }
}

function loadPlannerCount(): number {
  try {
    const plan: Record<string, string[]> = JSON.parse(localStorage.getItem(STORAGE_KEY_PLANNER) ?? '{}');
    return Object.values(plan).reduce((sum, arr) => sum + arr.length, 0);
  } catch { return 0; }
}

function loadCookCount(): number {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) ?? '[]').length; }
  catch { return 0; }
}

function getUserState(plannerCount: number, cookCount: number): UserState {
  if (plannerCount > 0 && cookCount > 0) return 'active';
  if (plannerCount > 0 && cookCount === 0) return 'has-plan';
  if (plannerCount === 0 && cookCount > 0) return 'returning';
  return 'new';
}

const GOAL_SUBTEXT: Record<string, string> = {
  'lose-weight': 'מתכונים עתירי חלבון ודלי קלוריות — בדיוק מה שצריך.',
  'eat-healthy': 'ארוחות טריות, מגוונות ומוכנות מראש — לאכול טוב כל השבוע.',
  'order-less':  'תכנון שבועי טוב מפחית הזמנות ושומר על הארנק.',
  'save-time':   'שעתיים של הכנה בשבוע = ארוחות מוכנות לכל השבוע.',
  'variety':     'גלו מתכונים חדשים בכל שבוע ושמרו על מגוון בתפריט.',
};

const FILTERS = [
  { id: 'all',       label: 'כל המתכונים' },
  { id: 'saved',     label: 'שמורים' },
  { id: 'chicken',   label: 'עוף' },
  { id: 'fish',      label: 'דגים' },
  { id: 'beef',      label: 'בשר' },
  { id: 'breakfast', label: 'ארוחת בוקר' },
  { id: 'salad',     label: 'סלטים' },
  { id: 'side',      label: 'תוספות' },
  { id: 'tofu',      label: 'טבעוני' },
  { id: 'dessert',   label: 'מתוקים' },
];

/* ─── Recipe Card ─────────────────────────────────────────── */
interface RecipeCardProps { title: string; image: string; time: string; tags: string[]; id: string; chef?: string; }

const RecipeCard: React.FC<RecipeCardProps> = ({ title, image, time, tags, id, chef }) => {
  const [imgError, setImgError] = React.useState(false);
  return (
  <Link href={`/recipes/${id}`} style={{ textDecoration: 'none' }}>
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(26,25,24,0.12)' }}
      transition={{ duration: 0.25 }}
      style={{ background: 'var(--card-bg)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,25,24,0.07)' }}
    >
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        {imgError ? (
          <RecipeImageFallback size="md" />
        ) : (
          <div
            style={{ width: '100%', height: '100%', backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            onError={() => setImgError(true)}
          />
        )}
        {tags[0] && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(26,25,24,0.75)', backdropFilter: 'blur(6px)', borderRadius: 20, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#fff' }}>
            {tags[0]}
          </div>
        )}
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            <Clock size={12} strokeWidth={2} />
            {time} דק׳
          </div>
          {chef && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#14422d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                {chef.charAt(0)}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{chef}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  </Link>
  );
};

/* ─── Page ───────────────────────────────────────────────── */
export default function DashboardPage() {
  const { locale } = useLanguage();
  const { user } = useUser();
  const firstName = user?.firstName ?? null;
  const isHe = locale === 'he';
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const { savedIds } = useSaved();
  const { isSignedIn, isLoaded } = useAuth();
  const [plannerCount, setPlannerCount] = React.useState(0);
  const [cookCount, setCookCount] = React.useState(0);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    setPlannerCount(loadPlannerCount());
    setCookCount(loadCookCount());
    setProfile(loadProfile());
  }, []);

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchCookHistory().then(history => {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
      setCookCount(history.length);
    }).catch(() => {});
    fetchPlanner().then(({ plan }) => {
      setPlannerCount(Object.values(plan as Record<string, string[]>).reduce((s, a) => s + a.length, 0));
    }).catch(() => {});
    fetchProfile().then(p => {
      if (p) {
        localStorage.setItem('easyprep_profile', JSON.stringify(p));
        setProfile(p as unknown as UserProfile);
      }
    }).catch(() => {});
  }, [isSignedIn, isLoaded]);

  const userState = getUserState(plannerCount, cookCount);

  const filteredRecipes = React.useMemo(() => {
    let list = recipes;
    if (activeFilter === 'saved') list = recipes.filter(r => savedIds.includes(r.id));
    else if (activeFilter !== 'all') list = recipes.filter(r => r.category === activeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => r.nameHe.toLowerCase().includes(q) || r.nameEn.toLowerCase().includes(q));
    }
    return list;
  }, [activeFilter, search, savedIds]);

  const recommendedRecipes = React.useMemo(() => {
    let base = recipes.filter(r => r.tags.includes('recommended'));
    if (profile?.dietaryPrefs?.length && !profile.dietaryPrefs.includes('none')) {
      const prefs = profile.dietaryPrefs;
      const filtered = base.filter(r => {
        const allTags = [...(r.tags ?? []), ...(r.dietaryTags ?? [])];
        if (prefs.includes('vegan') && !allTags.includes('vegan')) return false;
        if (prefs.includes('vegetarian') && !allTags.some(t => t === 'vegetarian' || t === 'vegan')) return false;
        if (prefs.includes('gluten-free') && !allTags.includes('gluten-free')) return false;
        if (prefs.includes('dairy-free') && !allTags.includes('dairy-free')) return false;
        return true;
      });
      if (filtered.length >= 3) base = filtered;
    }
    return base.slice(0, 4);
  }, [profile]);

  const batchPreviewRecipes = React.useMemo(() =>
    recipes.filter(r => r.tags.includes('recommended')).slice(0, 3), []);

  /* ── Hero config per user state ── */
  const hero = React.useMemo(() => {
    const base = {
      title: isHe ? 'בואו נכין את האוכל שלכם לשבוע' : 'Let\'s prep your food for the week',
      body: isHe
        ? 'בחרו מתכונים, קבלו רשימת קניות והכינו הכול בסדר עבודה אחד.'
        : 'Choose recipes, get a shopping list, and prep everything in one session.',
    };

    if (userState === 'new') {
      return {
        ...base,
        body: profile?.goal
          ? (isHe ? GOAL_SUBTEXT[profile.goal] ?? base.body : base.body)
          : base.body,
        cta1: { label: isHe ? 'התחלת תכנון שבועי' : 'Start weekly planning', href: '/planner' },
        cta2: { label: isHe ? 'צפייה במתכונים' : 'Browse recipes', href: '/' },
      };
    }
    if (userState === 'has-plan') {
      return {
        ...base,
        title: isHe ? 'רשימת הקניות שלכם מוכנה' : 'Your shopping list is ready',
        body: isHe ? 'יש לכם תכנון — עכשיו צרו רשימת קניות והתחילו להכין.' : 'You have a plan — now get the shopping list and start cooking.',
        cta1: { label: isHe ? 'פתיחת רשימת הקניות' : 'Open shopping list', href: '/checklist' },
        cta2: null,
      };
    }
    if (userState === 'active') {
      return {
        ...base,
        title: isHe ? (firstName ? `המשך להכין, ${firstName}` : 'המשך להכין') : 'Keep it up!',
        body: isHe ? 'יש לכם תכנון פעיל — המשיכו מאיפה שעצרתם.' : 'You have an active plan — pick up where you left off.',
        cta1: { label: isHe ? 'המשך התכנון' : 'Continue planning', href: '/planner' },
        cta2: null,
      };
    }
    // returning
    return {
      ...base,
      title: isHe ? 'ברוכים הבאים חזרה' : 'Welcome back',
      body: isHe ? 'הגיע הזמן לתכנן שבוע חדש.' : 'Time to plan a new week.',
      cta1: { label: isHe ? 'תכנון שבוע חדש' : 'Plan a new week', href: '/planner' },
      cta2: null,
    };
  }, [userState, profile, firstName, isHe]);

  return (
    <div dir="rtl" style={{ minHeight: '100vh', padding: '24px 16px 80px', background: 'var(--bg-page)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Section 1: Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, #14422d 0%, #1d5c3e 100%)',
            borderRadius: 24, padding: '36px 32px', marginBottom: 32, color: '#fff',
          }}
        >
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.3 }}>
            {hero.title}
          </h1>
          <p style={{ fontSize: 15, opacity: 0.85, margin: '0 0 28px', lineHeight: 1.6 }}>
            {hero.body}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href={hero.cta1.href}
              style={{
                padding: '12px 24px', borderRadius: 12,
                background: '#fff', color: '#14422d',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {hero.cta1.label}
            </Link>
            {hero.cta2 && (
              <Link
                href={hero.cta2.href}
                style={{
                  padding: '12px 24px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.15)', color: '#fff',
                  fontWeight: 600, fontSize: 14, textDecoration: 'none',
                  display: 'inline-block', border: '1.5px solid rgba(255,255,255,0.3)',
                }}
              >
                {hero.cta2.label}
              </Link>
            )}
          </div>
        </motion.div>

        {/* ── Section 2: Batch Prep Preview ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ background: 'var(--bg-surface)', borderRadius: 20, padding: '24px', marginBottom: 32, boxShadow: '0 4px 20px rgba(26,25,24,0.06)' }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1c1b', marginBottom: 4 }}>
            {isHe ? 'ככה עובד המילפרפ' : 'How meal prep works'}
          </h2>
          <p style={{ fontSize: 13, color: '#A09893', margin: '0 0 20px' }}>
            {isHe ? '3 מתכונים. רשימת קניות אחת. תהליך הכנה מסודר.' : '3 recipes. One shopping list. One prep session.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {batchPreviewRecipes.map((r, i) => (
              <React.Fragment key={r.id}>
                <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: `url(${r.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                </div>
                {i < batchPreviewRecipes.length - 1 && (
                  <span style={{ fontSize: 16, color: '#A09893' }}>+</span>
                )}
              </React.Fragment>
            ))}
            <span style={{ fontSize: 16, color: '#A09893', marginInline: 4 }}>→</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#14422d', background: '#EBF2ED', borderRadius: 8, padding: '4px 10px' }}>
                {isHe ? 'רשימת קניות אחת' : 'One shopping list'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#C9572A', background: '#FBF0EB', borderRadius: 8, padding: '4px 10px' }}>
                {isHe ? 'הכנה אחת' : 'One prep session'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Section 3: Recommended Recipes ── */}
        {recommendedRecipes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{ marginBottom: 32 }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1c1b', marginBottom: 16 }}>
              {isHe ? 'מתכונים מומלצים' : 'Recommended recipes'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
              {recommendedRecipes.map(r => (
                <RecipeCard
                  key={r.id}
                  id={r.id}
                  title={isHe ? r.nameHe : r.nameEn}
                  image={r.image}
                  time={String(r.prepTimeMin + r.cookTimeMin)}
                  tags={r.dietaryTags ?? []}
                  chef={r.chefName}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Section 4: Personal Insight Card (only when real data) ── */}
        {(plannerCount > 0 || savedIds.length > 0 || cookCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              background: 'var(--bg-surface)', borderRadius: 16, padding: '18px 20px',
              marginBottom: 32, border: '1px solid #E0D9CE',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div>
              {plannerCount > 0 ? (
                <>
                  <div style={{ fontSize: 13, color: '#A09893', marginBottom: 2 }}>
                    {isHe ? 'תכניות השבוע' : 'This week\'s plan'}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#14422d' }}>
                    {plannerCount} <span style={{ fontSize: 14, fontWeight: 500, color: '#6B6560' }}>{isHe ? 'ארוחות' : 'meals'}</span>
                  </div>
                </>
              ) : savedIds.length > 0 ? (
                <>
                  <div style={{ fontSize: 13, color: '#A09893', marginBottom: 2 }}>
                    {isHe ? 'מתכונים שמורים' : 'Saved recipes'}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#14422d' }}>
                    {savedIds.length} <span style={{ fontSize: 14, fontWeight: 500, color: '#6B6560' }}>{isHe ? 'מתכונים' : 'recipes'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#A09893', marginBottom: 2 }}>
                    {isHe ? 'ארוחות שהוכנו' : 'Meals cooked'}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#14422d' }}>
                    {cookCount}
                  </div>
                </>
              )}
            </div>
            <Link
              href={plannerCount > 0 ? '/planner' : '/'}
              style={{
                fontSize: 13, fontWeight: 700, color: '#14422d',
                textDecoration: 'none', background: '#EBF2ED',
                borderRadius: 10, padding: '8px 16px',
              }}
            >
              {isHe ? 'פתיחה' : 'Open'}
            </Link>
          </motion.div>
        )}

        {/* ── Section 5: Recipe Grid ── */}
        <div id="tour-recipes">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1918', flexShrink: 0 }}>
              {isHe ? 'כל המתכונים' : 'All recipes'}
            </h2>
            <div style={{ position: 'relative', maxWidth: 280, width: '100%' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(26,25,24,0.4)" strokeWidth="2"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder={isHe ? 'חפש מתכון...' : 'Search recipe...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '11px 36px 11px 14px',
                  borderRadius: 9999, border: '1px solid #E0D9CE',
                  background: '#fff', fontSize: 13, color: '#1A1918',
                  outline: 'none', direction: 'rtl',
                }}
                onFocus={e => (e.target.style.borderColor = '#14422d')}
                onBlur={e => (e.target.style.borderColor = '#E0D9CE')}
              />
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20, scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  flexShrink: 0, padding: '10px 16px', borderRadius: 9999, border: 'none',
                  background: activeFilter === f.id ? '#14422d' : '#e8e2d6',
                  color: activeFilter === f.id ? '#ffffff' : '#414943',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Recipe grid */}
          <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 20 }}>
            {filteredRecipes.map(r => (
              <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                <RecipeCard
                  id={r.id}
                  title={isHe ? r.nameHe : r.nameEn}
                  image={r.image}
                  time={String(r.prepTimeMin + r.cookTimeMin)}
                  tags={r.dietaryTags ?? []}
                  chef={r.chefName ?? 'אביב קיסין'}
                />
              </motion.div>
            ))}
          </motion.div>

          {filteredRecipes.length === 0 && (search.trim() || activeFilter !== 'all') && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(26,25,24,0.4)', fontSize: 14 }}>
              {isHe ? 'לא נמצאו מתכונים — נסו חיפוש אחר' : 'No recipes found — try a different search'}
            </div>
          )}

          {filteredRecipes.length === 0 && !search.trim() && activeFilter === 'all' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 20 }}>
              {Array.from({ length: 8 }).map((_, i) => <RecipeCardSkeleton key={i} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
