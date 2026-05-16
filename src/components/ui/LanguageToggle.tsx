'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border border-gray-200 p-0.5 text-sm font-medium">
      <button
        onClick={() => setLocale('he')}
        className={`px-3 py-1 rounded-full transition-colors ${
          locale === 'he'
            ? 'bg-emerald-600 text-white'
            : 'text-gray-500 hover:text-gray-800'
        }`}
        aria-label="עברית"
      >
        עב
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1 rounded-full transition-colors ${
          locale === 'en'
            ? 'bg-emerald-600 text-white'
            : 'text-gray-500 hover:text-gray-800'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
