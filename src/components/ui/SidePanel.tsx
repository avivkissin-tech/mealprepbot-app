'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useUser, useAuth, SignInButton } from '@clerk/nextjs';
import { useSaved } from '@/context/SavedContext';
import { recipes } from '@/data/recipes';
import { useRouter } from 'next/navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  onFeedback: () => void;
}

const NAV_LINKS = [
  { href: '/',          labelHe: 'מאגר מתכונים',   labelEn: 'Recipe Library',   icon: '📖', tourId: 'tour-recipes' },
  { href: '/checklist', labelHe: 'תכנון מילפרפ',   labelEn: 'Meal Prep Planner', icon: '📋', tourId: 'tour-checklist' },
  { href: '/planner',   labelHe: 'פלאנר שבועי',     labelEn: 'Weekly Planner',    icon: '🗓', tourId: 'tour-planner' },
  { href: '/mealprep',  labelHe: 'מדריך AI',        labelEn: 'AI Guide',          icon: '🤖', tourId: 'tour-wizard' },
];

export default function SidePanel({ isOpen, onClose, onStartTour, onFeedback }: Props) {
  const { locale } = useLanguage();
  const isHe = locale === 'he';
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { savedIds } = useSaved();
  const [search, setSearch] = useState('');
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if ('Notification' in window) setNotifPerm(Notification.permission);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 200);
    }
  }, [isOpen]);

  const searchResults = search.trim().length > 1
    ? recipes.filter(r =>
        r.nameHe.includes(search) ||
        r.nameEn.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
      onClose();
    }
  }

  async function requestNotif() {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  }

  // Slide direction: right side for RTL (Hebrew), left for LTR
  const slideX = isHe ? '100%' : '-100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(26,25,24,0.45)' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: slideX }}
            animate={{ x: 0 }}
            exit={{ x: slideX }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            dir={isHe ? 'rtl' : 'ltr'}
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              [isHe ? 'right' : 'left']: 0,
              zIndex: 9501,
              width: 300,
              background: '#fff',
              boxShadow: isHe
                ? '-8px 0 40px rgba(26,25,24,0.15)'
                : '8px 0 40px rgba(26,25,24,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 14, [isHe ? 'left' : 'right']: 14,
                width: 32, height: 32, borderRadius: '50%',
                background: '#F0EBE3', border: 'none',
                fontSize: 18, cursor: 'pointer', color: '#6B6560',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1,
              }}
            >×</button>

            {/* ── Profile section ── */}
            <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #F0EBE3' }}>
              {isSignedIn && user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {user.imageUrl && (
                    <Image
                      src={user.imageUrl}
                      alt={user.firstName ?? ''}
                      width={48}
                      height={48}
                      style={{ borderRadius: '50%', border: '2px solid #E0D9CE', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1c1b', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(26,25,24,0.45)', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.emailAddresses[0]?.emailAddress}
                    </p>
                    <Link
                      href="/profile"
                      onClick={onClose}
                      style={{ fontSize: 11, fontWeight: 600, color: '#14422d', textDecoration: 'none', background: '#EBF2ED', padding: '3px 10px', borderRadius: 9999 }}
                    >
                      {isHe ? 'עריכת פרופיל' : 'Edit Profile'}
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.5)', margin: '0 0 10px' }}>
                    {isHe ? 'כניסה לשמירת ההתקדמות שלך' : 'Sign in to save your progress'}
                  </p>
                  <SignInButton mode="modal">
                    <button style={{ padding: '8px 20px', borderRadius: 9999, background: '#14422d', border: 'none', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                      {isHe ? 'כניסה / הרשמה' : 'Sign in / Sign up'}
                    </button>
                  </SignInButton>
                </div>
              )}
            </div>

            {/* ── Search ── */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EBE3' }}>
              <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={isHe ? '🔍 חיפוש מתכון...' : '🔍 Search recipes...'}
                  style={{
                    width: '100%', padding: '9px 14px', borderRadius: 10,
                    border: '1.5px solid #E0D9CE', fontSize: 13,
                    background: '#faf9f7', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </form>
              {/* Search results */}
              {searchResults.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {searchResults.map(r => (
                    <Link
                      key={r.id}
                      href={`/recipes/${r.id}`}
                      onClick={() => { setSearch(''); onClose(); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', textDecoration: 'none', borderBottom: '1px solid #F0EBE3' }}
                    >
                      <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                        <Image src={r.image} alt="" fill sizes="32px" style={{ objectFit: 'cover' }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#1a1c1b', fontWeight: 600 }}>{isHe ? r.nameHe : r.nameEn}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Notifications ── */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EBE3' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🔔</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1c1b', margin: 0 }}>{isHe ? 'התראות' : 'Notifications'}</p>
                    <p style={{ fontSize: 11, color: 'rgba(26,25,24,0.45)', margin: 0 }}>
                      {notifPerm === 'granted' ? (isHe ? 'מופעל' : 'Enabled') : notifPerm === 'denied' ? (isHe ? 'חסום' : 'Blocked') : (isHe ? 'לא הופעל' : 'Not enabled')}
                    </p>
                  </div>
                </div>
                {notifPerm === 'default' && (
                  <button
                    onClick={requestNotif}
                    style={{ padding: '5px 12px', borderRadius: 9999, background: '#EBF2ED', border: 'none', fontSize: 11, fontWeight: 600, color: '#14422d', cursor: 'pointer' }}
                  >
                    {isHe ? 'הפעל' : 'Enable'}
                  </button>
                )}
                {notifPerm === 'granted' && <span style={{ fontSize: 16 }}>✅</span>}
              </div>
            </div>

            {/* ── Navigation ── */}
            <nav style={{ padding: '10px 12px', flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#A09893', margin: '6px 8px 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isHe ? 'ניווט' : 'Navigation'}
              </p>
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  id={link.tourId}
                  onClick={onClose}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 10, textDecoration: 'none', color: '#1a1c1b', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F7F3EE')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{link.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{isHe ? link.labelHe : link.labelEn}</span>
                  {link.href === '/' && savedIds.length > 0 && (
                    <span style={{ marginInline: 'auto', fontSize: 10, background: '#EBF2ED', color: '#14422d', padding: '2px 7px', borderRadius: 9999, fontWeight: 700 }}>
                      {isHe ? `${savedIds.length} שמורים` : `${savedIds.length} saved`}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* ── Bottom actions ── */}
            <div style={{ padding: '12px', borderTop: '1px solid #F0EBE3' }}>
              <button
                onClick={() => { onStartTour(); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 10px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: isHe ? 'right' : 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F7F3EE')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🧭</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1c1b' }}>{isHe ? 'התחל סיור' : 'Start Tour'}</span>
              </button>

              <button
                onClick={() => { onFeedback(); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 10px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: isHe ? 'right' : 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F7F3EE')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>💬</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1c1b' }}>{isHe ? 'עזרו לנו להשתפר' : 'Help us improve'}</span>
              </button>

              {isSignedIn && (
                <Link
                  href="/profile"
                  onClick={onClose}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 10, textDecoration: 'none', color: '#1a1c1b' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F7F3EE')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>⚙️</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{isHe ? 'הגדרות פרופיל' : 'Profile Settings'}</span>
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
