'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const RECIPE_LINKS = [
  { labelHe: 'כל המתכונים',  href: '/recipes' },
  { labelHe: 'ארוחות ערב',   href: '/recipes?cat=chicken' },
  { labelHe: 'ארוחות בוקר',  href: '/recipes?cat=breakfast' },
  { labelHe: 'סלטים',        href: '/recipes?cat=salad' },
  { labelHe: 'תוספות',       href: '/recipes?cat=side' },
  { labelHe: 'טבעוני',       href: '/recipes?cat=tofu' },
];

export default function Footer() {
  const { locale } = useLanguage();
  const isHe = locale === 'he';

  return (
    <footer style={{ background: '#1A1918', borderTop: '1px solid #2E2B2A' }} className="print:hidden">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Top row — brand + nav */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect width="20" height="20" rx="5" fill="#2A4F3A" />
              <path d="M5 14 L10 6 L15 14" stroke="#F7F3EE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M7.5 11 L12.5 11" stroke="#C9572A" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="font-semibold text-sm" style={{ color: '#F7F3EE', letterSpacing: '-0.01em' }}>
              Easy PREP Nutrition
            </span>
          </div>

          {/* Horizontal nav links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {RECIPE_LINKS.map(({ labelHe, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm transition-opacity"
                style={{ color: 'rgba(247,243,238,0.45)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(247,243,238,0.9)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,243,238,0.45)')}
              >
                {labelHe}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#2E2B2A', marginBottom: 24 }} />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'rgba(247,243,238,0.25)' }}>
            {isHe ? '© 2025 Easy PREP Nutrition · כל הזכויות שמורות' : '© 2025 Easy PREP Nutrition · All rights reserved'}
          </p>
          <div className="flex items-center gap-4">
            {/* Instagram */}
            <a href="#" aria-label="Instagram" style={{ color: 'rgba(247,243,238,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(247,243,238,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,243,238,0.3)')}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
            {/* TikTok */}
            <a href="#" aria-label="TikTok" style={{ color: 'rgba(247,243,238,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(247,243,238,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(247,243,238,0.3)')}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
