'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { useUser, useAuth, SignInButton, useClerk } from '@clerk/nextjs';
import { useSaved } from '@/context/SavedContext';
import { recipes } from '@/data/recipes';
import { useRouter, usePathname } from 'next/navigation';
import FeedbackModal from '@/components/ui/FeedbackModal';
import SiteTour from '@/components/ui/SiteTour';
import WelcomeModal from '@/components/ui/WelcomeModal';
import LanguageToggle from '@/components/ui/LanguageToggle';

const NAV_LINKS = [
  { href: '/',           labelHe: 'מאגר מתכונים',    labelEn: 'Recipes',         tourId: 'tour-recipes' },
  { href: '/checklist',  labelHe: 'תכנון מילפרפ',    labelEn: 'Meal Prep',       tourId: 'tour-checklist' },
  { href: '/planner',    labelHe: 'פלאנר שבועי',      labelEn: 'Weekly Planner',  tourId: 'tour-planner' },
  { href: '/ingredients',labelHe: 'מה יש לי במקרר',  labelEn: 'Fridge Recipes',  tourId: 'tour-fridge-title' },
];

// SVG icons per nav link
function NavIcon({ href }: { href: string }) {
  if (href === '/') return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
  if (href === '/checklist') return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
  if (href === '/planner') return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
  if (href === '/ingredients') return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
  return null;
}

// Theme icons
function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}
function SystemIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  );
}

export const SIDEBAR_WIDTH = 240;

export default function Sidebar() {
  const { locale } = useLanguage();
  const isHe = locale === 'he';
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { savedIds } = useSaved();
  const pathname = usePathname();
  const router = useRouter();
  const { mode: themeMode, setMode: setThemeMode, resolved: themeResolved } = useTheme();
  const isDark = themeResolved === 'dark';

  const [search, setSearch] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default');
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ('Notification' in window) setNotifPerm(Notification.permission);
  }, []);

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
      setMobileOpen(false);
    }
  }

  async function requestNotif() {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  // Themed color helpers
  const c = {
    bg: isDark ? 'var(--sidebar-bg)' : '#fff',
    border: isDark ? 'var(--sidebar-border)' : '#E0D9CE',
    borderFaint: isDark ? 'var(--border-2)' : '#F0EBE3',
    text: isDark ? 'var(--text-primary)' : '#1a1c1b',
    textSecondary: isDark ? 'var(--text-secondary)' : '#6B6560',
    textMuted: isDark ? 'var(--text-muted)' : '#A09893',
    inputBg: isDark ? 'var(--bg-surface-2)' : '#faf9f7',
    hover: isDark ? 'var(--bg-hover)' : '#F7F3EE',
    activeBg: isDark ? '#1e3028' : '#EBF2ED',
    activeText: '#14422d',
    searchResultBg: isDark ? 'var(--bg-surface)' : '#fff',
  };

  // Initials avatar (when user has no photo)
  const initials = user
    ? [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'
    : '';

  const themeOptions: { mode: ThemeMode; icon: React.ReactNode; labelHe: string; labelEn: string }[] = [
    { mode: 'light', icon: <SunIcon />, labelHe: 'בהיר', labelEn: 'Light' },
    { mode: 'dark',  icon: <MoonIcon />, labelHe: 'כהה', labelEn: 'Dark' },
    { mode: 'system', icon: <SystemIcon />, labelHe: 'מערכת', labelEn: 'System' },
  ];

  const sidebarContent = (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      style={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: c.bg,
        borderLeft: isHe ? 'none' : `1px solid ${c.border}`,
        borderRight: isHe ? `1px solid ${c.border}` : 'none',
        overflow: 'hidden',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: `1px solid ${c.borderFaint}`, flexShrink: 0 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="5" fill="#14422d" />
            <path d="M5 14 L10 6 L15 14" stroke="#faf9f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M7.5 11 L12.5 11" stroke="#C9572A" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: c.text, letterSpacing: '-0.01em' }}>
            Easy PREP
          </span>
        </Link>
      </div>

      {/* Profile */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.borderFaint}`, flexShrink: 0 }}>
        {isSignedIn && user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Avatar: photo or initials */}
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.firstName ?? ''}
                  width={38}
                  height={38}
                  style={{ borderRadius: '50%', border: `1.5px solid ${c.border}`, flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: '#14422d', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                  border: `1.5px solid ${c.border}`,
                }}>
                  {initials}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: c.text, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.firstName}
                </p>
                <Link href="/profile" style={{ fontSize: 10, color: '#14422d', fontWeight: 600, textDecoration: 'none' }}>
                  {isHe ? 'עריכת פרופיל' : 'Edit profile'}
                </Link>
              </div>
            </div>
            {/* Logout */}
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              style={{
                marginTop: 10, width: '100%', padding: '6px 0',
                borderRadius: 8, border: `1px solid ${c.border}`,
                background: 'transparent', fontSize: 11, fontWeight: 600,
                color: c.textSecondary, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = c.hover; e.currentTarget.style.color = '#C9572A'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.textSecondary; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {isHe ? 'התנתקות' : 'Sign out'}
            </button>
          </>
        ) : (
          <SignInButton mode="modal">
            <button style={{ width: '100%', padding: '8px 14px', borderRadius: 9999, background: '#14422d', border: 'none', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              {isHe ? 'כניסה / הרשמה' : 'Sign in'}
            </button>
          </SignInButton>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.borderFaint}`, flexShrink: 0 }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ position: 'relative' }}>
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={c.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isHe ? 'right' : 'left']: 10 }}
            >
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isHe ? 'חיפוש מתכון...' : 'Search recipes...'}
              style={{
                width: '100%', padding: isHe ? '8px 30px 8px 10px' : '8px 10px 8px 30px',
                borderRadius: 9, border: `1.5px solid ${c.border}`, fontSize: 12,
                background: c.inputBg, outline: 'none', boxSizing: 'border-box',
                color: c.text,
              }}
            />
          </div>
        </form>
        {searchResults.length > 0 && (
          <div style={{ marginTop: 6, borderRadius: 8, overflow: 'hidden', border: `1px solid ${c.borderFaint}` }}>
            {searchResults.map(r => (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                onClick={() => setSearch('')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', textDecoration: 'none', borderBottom: `1px solid ${c.borderFaint}`, background: c.searchResultBg }}
              >
                <div style={{ position: 'relative', width: 28, height: 28, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={r.image} alt="" fill sizes="28px" style={{ objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: 11, color: c.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isHe ? r.nameHe : r.nameEn}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: '8px 10px', flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, margin: '4px 6px 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isHe ? 'ניווט' : 'Navigation'}
        </p>
        {NAV_LINKS.map(link => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              id={link.tourId}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 10, textDecoration: 'none',
                marginBottom: 2,
                background: active ? c.activeBg : 'transparent',
                color: active ? c.activeText : c.text,
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = c.hover; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: active ? c.activeText : c.text }}>
                <NavIcon href={link.href} />
              </span>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{isHe ? link.labelHe : link.labelEn}</span>
              {link.href === '/' && savedIds.length > 0 && (
                <span style={{ marginInlineStart: 'auto', fontSize: 9, background: '#14422d', color: '#fff', padding: '2px 6px', borderRadius: 9999, fontWeight: 700 }}>
                  {savedIds.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Notifications */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${c.borderFaint}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span style={{ fontSize: 12, color: c.textSecondary, fontWeight: 500 }}>
              {notifPerm === 'granted'
                ? (isHe ? 'התראות פעילות' : 'Notifications on')
                : (isHe ? 'התראות' : 'Notifications')}
            </span>
          </div>
          {notifPerm === 'default' && (
            <button onClick={requestNotif} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 9999, background: '#EBF2ED', border: 'none', color: '#14422d', fontWeight: 700, cursor: 'pointer' }}>
              {isHe ? 'הפעל' : 'On'}
            </button>
          )}
          {notifPerm === 'granted' && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14422d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
      </div>

      {/* Theme toggle */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${c.borderFaint}`, flexShrink: 0 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isHe ? 'ערכת נושא' : 'Theme'}
        </p>
        <div style={{ display: 'flex', gap: 4 }}>
          {themeOptions.map(opt => {
            const isSelected = themeMode === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => setThemeMode(opt.mode)}
                title={isHe ? opt.labelHe : opt.labelEn}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 8,
                  border: `1px solid ${isSelected ? '#14422d' : c.border}`,
                  background: isSelected ? '#EBF2ED' : 'transparent',
                  color: isSelected ? '#14422d' : c.textSecondary,
                  fontSize: 10, fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'all 0.12s',
                }}
              >
                {opt.icon}
                <span>{isHe ? opt.labelHe : opt.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding: '8px 10px', borderTop: `1px solid ${c.borderFaint}`, flexShrink: 0 }}>
        <button
          onClick={() => { setTourActive(true); setMobileOpen(false); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 2 }}
          onMouseEnter={e => (e.currentTarget.style.background = c.hover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textSecondary }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{isHe ? 'התחל סיור' : 'Start Tour'}</span>
        </button>

        <button
          onClick={() => { setFeedbackOpen(true); setMobileOpen(false); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 2 }}
          onMouseEnter={e => (e.currentTarget.style.background = c.hover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textSecondary }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{isHe ? 'עזרו לנו להשתפר' : 'Give feedback'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px' }}>
          <span style={{ fontSize: 11, color: c.textMuted }}>Easy PREP © 2025</span>
          <LanguageToggle />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: permanent sidebar */}
      <div
        className="hidden md:block print:hidden"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          [isHe ? 'right' : 'left']: 0,
          width: SIDEBAR_WIDTH,
          zIndex: 40,
        }}
      >
        {sidebarContent}
      </div>

      {/* Mobile: floating hamburger + overlay */}
      <div className="md:hidden print:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed', bottom: 20, [isHe ? 'right' : 'left']: 16,
            zIndex: 9400, width: 44, height: 44, borderRadius: '50%',
            background: '#14422d', border: 'none',
            boxShadow: '0 4px 16px rgba(20,66,45,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <div
                onClick={() => setMobileOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(26,25,24,0.45)' }}
              />
              <div
                style={{
                  position: 'fixed', top: 0, bottom: 0,
                  [isHe ? 'right' : 'left']: 0,
                  width: SIDEBAR_WIDTH,
                  zIndex: 9501,
                  boxShadow: '0 0 40px rgba(26,25,24,0.2)',
                }}
              >
                <button
                  onClick={() => setMobileOpen(false)}
                  style={{
                    position: 'absolute', top: 12,
                    [isHe ? 'left' : 'right']: 12,
                    zIndex: 1, width: 28, height: 28,
                    borderRadius: '50%', background: '#F0EBE3',
                    border: 'none', fontSize: 16, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6B6560',
                  }}
                >×</button>
                {sidebarContent}
              </div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <SiteTour forceShow={tourActive} onDone={() => setTourActive(false)} />
      <WelcomeModal onStartTour={() => setTourActive(true)} />
      <AnimatePresence>
        {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
