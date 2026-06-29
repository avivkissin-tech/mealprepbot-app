'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useLanguage } from '@/context/LanguageContext';
import { useSaved } from '@/context/SavedContext';
import { recipes } from '@/data/recipes';
import { fetchProfile, pushProfile } from '@/lib/userDataApi';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

type GoalType = 'save-money' | 'eat-healthy' | 'save-time' | 'all';
type MonthlyBudget = 'under-500' | '500-1000' | '1000-1500' | 'over-1500';
type PrepFrequency = 'never' | '1-2' | '3-5' | 'always';

interface UserProfile {
  goal?: GoalType;
  householdSize?: number;
  monthlyBudget?: MonthlyBudget;
  prepFrequency?: PrepFrequency;
  dietaryPrefs?: string[];
  estimatedSavings?: number;
  completedAt?: string;
}

const GOAL_OPTIONS: { value: GoalType; he: string; en: string; emoji: string }[] = [
  { value: 'save-money', he: 'לחסוך כסף', en: 'Save money', emoji: '💰' },
  { value: 'eat-healthy', he: 'לאכול בריא', en: 'Eat healthy', emoji: '🥗' },
  { value: 'save-time', he: 'לחסוך זמן', en: 'Save time', emoji: '⏱' },
  { value: 'all', he: 'הכל יחד', en: 'All of the above', emoji: '✨' },
];

const BUDGET_OPTIONS: { value: MonthlyBudget; he: string; en: string }[] = [
  { value: 'under-500', he: 'עד ₪500', en: 'Under ₪500' },
  { value: '500-1000', he: '₪500–₪1,000', en: '₪500–₪1,000' },
  { value: '1000-1500', he: '₪1,000–₪1,500', en: '₪1,000–₪1,500' },
  { value: 'over-1500', he: 'מעל ₪1,500', en: 'Over ₪1,500' },
];

const FREQ_OPTIONS: { value: PrepFrequency; he: string; en: string }[] = [
  { value: 'never', he: 'כמעט אף פעם', en: 'Almost never' },
  { value: '1-2', he: '1–2 פעמים בשבוע', en: '1–2 times/week' },
  { value: '3-5', he: '3–5 פעמים בשבוע', en: '3–5 times/week' },
  { value: 'always', he: 'כל יום', en: 'Every day' },
];

const DIETARY_OPTIONS = [
  { value: 'vegan', he: 'טבעוני', en: 'Vegan' },
  { value: 'vegetarian', he: 'צמחוני', en: 'Vegetarian' },
  { value: 'gluten-free', he: 'ללא גלוטן', en: 'Gluten-free' },
  { value: 'dairy-free', he: 'ללא חלב', en: 'Dairy-free' },
];

export default function ProfilePage() {
  const { locale } = useLanguage();
  const isHe = locale === 'he';
  const { user } = useUser();
  const { isSignedIn, isLoaded } = useAuth();
  const { savedIds, toggleSaved } = useSaved();

  const [profile, setProfile] = useState<UserProfile>({});
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<UserProfile>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default');

  // Load profile
  useEffect(() => {
    try {
      const raw = localStorage.getItem('easyprep_profile');
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
    if (!isLoaded || !isSignedIn) return;
    fetchProfile().then(p => {
      if (p) setProfile(p as UserProfile);
    }).catch(() => {});
  }, [isSignedIn, isLoaded]);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) setNotifPerm(Notification.permission);
  }, []);

  const savedRecipes = recipes.filter(r => savedIds.includes(r.id));

  function startEdit() {
    setDraft({ ...profile });
    setEditMode(true);
    setSaved(false);
  }

  async function saveEdit() {
    setSaving(true);
    const updated = { ...draft };
    setProfile(updated);
    try { localStorage.setItem('easyprep_profile', JSON.stringify(updated)); } catch {}
    if (isSignedIn) await pushProfile(updated as Record<string, unknown>);
    setSaving(false);
    setSaved(true);
    setEditMode(false);
  }

  async function requestNotifications() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  }

  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <div dir={isHe ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#faf9f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 16, color: '#1a1c1b', fontWeight: 600 }}>{isHe ? 'יש להתחבר כדי לצפות בפרופיל' : 'Sign in to view your profile'}</p>
        <Link href="/" style={{ color: '#14422d', fontWeight: 600, fontSize: 14 }}>{isHe ? '→ חזרה לבית' : '→ Back home'}</Link>
      </div>
    );
  }

  const current = editMode ? draft : profile;

  return (
    <div dir={isHe ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#faf9f7' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          {user?.imageUrl && (
            <Image
              src={user.imageUrl}
              alt={user.firstName ?? ''}
              width={64}
              height={64}
              style={{ borderRadius: '50%', border: '2px solid #E0D9CE' }}
            />
          )}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1c1b', margin: '0 0 2px' }}>
              {user?.firstName} {user?.lastName}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.5)', margin: 0 }}>{user?.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>

        {/* Preferences card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E0D9CE', padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1c1b', margin: 0 }}>
              {isHe ? '⚙️ העדפות שלי' : '⚙️ My Preferences'}
            </h2>
            {!editMode ? (
              <button onClick={startEdit} style={{ padding: '6px 16px', borderRadius: 9999, background: '#F0EBE3', border: 'none', fontSize: 12, fontWeight: 600, color: '#6B6560', cursor: 'pointer' }}>
                {isHe ? 'עריכה' : 'Edit'}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditMode(false)} style={{ padding: '6px 14px', borderRadius: 9999, background: '#F0EBE3', border: 'none', fontSize: 12, fontWeight: 600, color: '#6B6560', cursor: 'pointer' }}>
                  {isHe ? 'ביטול' : 'Cancel'}
                </button>
                <button onClick={saveEdit} disabled={saving} style={{ padding: '6px 16px', borderRadius: 9999, background: saving ? '#c0c9c1' : '#14422d', border: 'none', fontSize: 12, fontWeight: 600, color: '#fff', cursor: saving ? 'default' : 'pointer' }}>
                  {saving ? (isHe ? 'שומר...' : 'Saving...') : (isHe ? 'שמור' : 'Save')}
                </button>
              </div>
            )}
          </div>

          {saved && !editMode && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 12, color: '#14422d', marginBottom: 12 }}>
              ✓ {isHe ? 'נשמר בהצלחה' : 'Saved successfully'}
            </motion.p>
          )}

          {/* Goal */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A09893', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isHe ? 'מטרה' : 'Goal'}</p>
            {editMode ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {GOAL_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setDraft(d => ({ ...d, goal: o.value }))} style={{ padding: '10px', borderRadius: 10, border: `1.5px solid ${draft.goal === o.value ? '#14422d' : '#E0D9CE'}`, background: draft.goal === o.value ? '#EBF2ED' : '#fff', fontSize: 13, fontWeight: 600, color: '#1a1c1b', cursor: 'pointer', textAlign: 'center' }}>
                    {o.emoji} {isHe ? o.he : o.en}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#1a1c1b', margin: 0 }}>
                {current.goal ? (GOAL_OPTIONS.find(o => o.value === current.goal)?.[isHe ? 'he' : 'en'] ?? '—') : '—'}
              </p>
            )}
          </div>

          {/* Household size */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A09893', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isHe ? 'גודל משק בית' : 'Household Size'}</p>
            {editMode ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 4, 5].map(n => (
                  <button key={n} onClick={() => setDraft(d => ({ ...d, householdSize: n }))} style={{ width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${draft.householdSize === n ? '#14422d' : '#E0D9CE'}`, background: draft.householdSize === n ? '#14422d' : '#fff', color: draft.householdSize === n ? '#fff' : '#1a1c1b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    {n === 5 ? '5+' : n}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#1a1c1b', margin: 0 }}>
                {current.householdSize ? `${current.householdSize === 5 ? '5+' : current.householdSize} ${isHe ? 'אנשים' : 'people'}` : '—'}
              </p>
            )}
          </div>

          {/* Prep frequency */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A09893', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isHe ? 'תדירות הכנה' : 'Prep Frequency'}</p>
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {FREQ_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setDraft(d => ({ ...d, prepFrequency: o.value }))} style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${draft.prepFrequency === o.value ? '#14422d' : '#E0D9CE'}`, background: draft.prepFrequency === o.value ? '#EBF2ED' : '#fff', fontSize: 13, fontWeight: 600, color: '#1a1c1b', cursor: 'pointer', textAlign: isHe ? 'right' : 'left' }}>
                    {isHe ? o.he : o.en}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#1a1c1b', margin: 0 }}>
                {current.prepFrequency ? (FREQ_OPTIONS.find(o => o.value === current.prepFrequency)?.[isHe ? 'he' : 'en'] ?? '—') : '—'}
              </p>
            )}
          </div>

          {/* Budget */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A09893', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isHe ? 'תקציב חודשי' : 'Monthly Budget'}</p>
            {editMode ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {BUDGET_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setDraft(d => ({ ...d, monthlyBudget: o.value }))} style={{ padding: '10px', borderRadius: 10, border: `1.5px solid ${draft.monthlyBudget === o.value ? '#14422d' : '#E0D9CE'}`, background: draft.monthlyBudget === o.value ? '#EBF2ED' : '#fff', fontSize: 13, fontWeight: 600, color: '#1a1c1b', cursor: 'pointer', textAlign: 'center' }}>
                    {isHe ? o.he : o.en}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#1a1c1b', margin: 0 }}>
                {current.monthlyBudget ? (BUDGET_OPTIONS.find(o => o.value === current.monthlyBudget)?.[isHe ? 'he' : 'en'] ?? '—') : '—'}
              </p>
            )}
          </div>

          {/* Dietary */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#A09893', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isHe ? 'העדפות תזונה' : 'Dietary Preferences'}</p>
            {editMode ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DIETARY_OPTIONS.map(o => {
                  const isSelected = draft.dietaryPrefs?.includes(o.value);
                  return (
                    <button key={o.value} onClick={() => setDraft(d => {
                      const prefs = d.dietaryPrefs ?? [];
                      return { ...d, dietaryPrefs: isSelected ? prefs.filter(p => p !== o.value) : [...prefs, o.value] };
                    })} style={{ padding: '7px 14px', borderRadius: 9999, border: `1.5px solid ${isSelected ? '#14422d' : '#E0D9CE'}`, background: isSelected ? '#14422d' : '#fff', color: isSelected ? '#fff' : '#6B6560', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {isHe ? o.he : o.en}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#1a1c1b', margin: 0 }}>
                {current.dietaryPrefs?.length
                  ? current.dietaryPrefs.map(p => DIETARY_OPTIONS.find(o => o.value === p)?.[isHe ? 'he' : 'en']).filter(Boolean).join(' · ')
                  : '—'}
              </p>
            )}
          </div>
        </div>

        {/* Notifications card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E0D9CE', padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1c1b', margin: '0 0 4px' }}>
                🔔 {isHe ? 'התראות' : 'Notifications'}
              </h2>
              <p style={{ fontSize: 12, color: 'rgba(26,25,24,0.5)', margin: 0 }}>
                {notifPerm === 'granted'
                  ? (isHe ? 'התראות מופעלות' : 'Notifications enabled')
                  : notifPerm === 'denied'
                    ? (isHe ? 'התראות חסומות בדפדפן' : 'Blocked in browser settings')
                    : (isHe ? 'אפשר לקבל תזכורות לבישול' : 'Get cooking reminders')}
              </p>
            </div>
            {notifPerm !== 'granted' && notifPerm !== 'denied' && (
              <button
                onClick={requestNotifications}
                style={{ padding: '8px 18px', borderRadius: 9999, background: '#14422d', border: 'none', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                {isHe ? 'אפשר' : 'Enable'}
              </button>
            )}
            {notifPerm === 'granted' && (
              <span style={{ fontSize: 20 }}>✅</span>
            )}
          </div>
        </div>

        {/* Saved recipes */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E0D9CE', padding: '20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1c1b', margin: '0 0 14px' }}>
            🔖 {isHe ? `מתכונים שמורים (${savedRecipes.length})` : `Saved Recipes (${savedRecipes.length})`}
          </h2>
          {savedRecipes.length === 0 ? (
            <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.4)', margin: 0 }}>
              {isHe ? 'עדיין לא שמרת מתכונים. לחץ על 🔖 בכל מתכון.' : 'No saved recipes yet. Tap 🔖 on any recipe.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {savedRecipes.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Link href={`/recipes/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, textDecoration: 'none' }}>
                    <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                      <Image src={r.image} alt="" fill sizes="44px" style={{ objectFit: 'cover' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1c1b', margin: '0 0 2px' }}>{isHe ? r.nameHe : r.nameEn}</p>
                      <p style={{ fontSize: 11, color: 'rgba(26,25,24,0.4)', margin: 0 }}>{r.prepTimeMin + r.cookTimeMin} {isHe ? 'דק׳' : 'min'}</p>
                    </div>
                  </Link>
                  <button onClick={() => toggleSaved(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#C9572A', padding: 4 }}>🔖</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
