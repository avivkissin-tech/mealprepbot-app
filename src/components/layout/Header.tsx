'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/ui/LanguageToggle';

interface DropdownItem { labelKey: string; href: string; }
interface NavItem { labelKey: string; href?: string; dropdown?: DropdownItem[]; }

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'nav.recipes',
    dropdown: [
      { labelKey: 'home.filter.all',       href: '/' },
      { labelKey: 'home.filter.fish',      href: '/?cat=fish' },
      { labelKey: 'home.filter.chicken',   href: '/?cat=chicken' },
      { labelKey: 'home.filter.turkey',    href: '/?cat=turkey' },
      { labelKey: 'home.filter.beef',      href: '/?cat=beef' },
      { labelKey: 'home.filter.tofu',      href: '/?cat=tofu' },
      { labelKey: 'home.filter.breakfast', href: '/?cat=breakfast' },
      { labelKey: 'home.filter.salad',     href: '/?cat=salad' },
      { labelKey: 'home.filter.side',      href: '/?cat=side' },
    ],
  },
  { labelKey: 'nav.ingredients', href: '/ingredients' },
  { labelKey: 'nav.checklist', href: '/checklist' },
  { labelKey: 'nav.planner',   href: '/planner' },
];

export default function Header() {
  const { t } = useLanguage();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 print:hidden border-b"
      style={{ background: '#F7F3EE', borderColor: '#E0D9CE' }}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="5" fill="#2A4F3A" />
            <path d="M5 14 L10 6 L15 14" stroke="#F7F3EE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M7.5 11 L12.5 11" stroke="#C9572A" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span
            className="font-semibold tracking-tight text-sm"
            style={{ color: '#1A1918', letterSpacing: '-0.01em' }}
          >
            {t('brand.name')}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.labelKey}
              className="relative"
              onMouseEnter={() => item.dropdown && setOpenMenu(item.labelKey)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              {item.href && !item.dropdown ? (
                <Link
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: '#6B6560' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#1A1918')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B6560')}
                >
                  {t(item.labelKey)}
                </Link>
              ) : (
                <button
                  className="flex items-center gap-0.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: '#6B6560' }}
                >
                  {t(item.labelKey)}
                  <svg className="w-3.5 h-3.5 mt-0.5" fill="none" viewBox="0 0 16 16">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}

              {item.dropdown && openMenu === item.labelKey && (
                <div
                  className="absolute top-full start-0 w-44 z-50"
                  style={{ paddingTop: 6 }}
                >
                <div
                  className="rounded-xl border py-1.5"
                  style={{ background: '#FFFFFF', borderColor: '#E0D9CE', boxShadow: '0 8px 24px rgba(26,25,24,0.10)' }}
                >
                  {item.dropdown.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="block px-4 py-2 text-sm transition-colors"
                      style={{ color: '#6B6560' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#1A1918'; e.currentTarget.style.background = '#F7F3EE'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#6B6560'; e.currentTarget.style.background = 'transparent'; }}
                      onClick={() => setOpenMenu(null)}
                    >
                      {t(sub.labelKey)}
                    </Link>
                  ))}
                </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/mealprep"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold rounded-full transition-colors"
            style={{ background: '#2A4F3A', color: '#FFFFFF' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#3D6B50')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2A4F3A')}
          >
            {t('nav.wizard')}
          </Link>
          <LanguageToggle />
          <button
            className="md:hidden p-1.5 rounded-lg"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{ color: '#6B6560' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
              {mobileOpen
                ? <path d="M4 4l12 12M4 16L16 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                : <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-3 space-y-1"
          style={{ background: '#F7F3EE', borderColor: '#E0D9CE' }}
        >
          <Link href="/" className="block py-2 text-sm font-medium" style={{ color: '#1A1918' }} onClick={() => setMobileOpen(false)}>
            {t('home.filter.all')}
          </Link>
          <Link href="/ingredients" className="block py-2 text-sm font-medium" style={{ color: '#1A1918' }} onClick={() => setMobileOpen(false)}>
            {t('nav.ingredients')}
          </Link>
          <Link href="/checklist" className="block py-2 text-sm font-medium" style={{ color: '#1A1918' }} onClick={() => setMobileOpen(false)}>
            {t('nav.checklist')}
          </Link>
          <Link href="/mealprep" className="block py-2 text-sm font-bold" style={{ color: '#2A4F3A' }} onClick={() => setMobileOpen(false)}>
            {t('nav.wizard')}
          </Link>
        </div>
      )}
    </header>
  );
}
