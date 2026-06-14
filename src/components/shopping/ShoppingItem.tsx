'use client';

import { useState } from 'react';
import { ShoppingListEntry } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  entry: ShoppingListEntry;
}

export default function ShoppingItem({ entry }: Props) {
  const { locale, t } = useLanguage();
  const [checked, setChecked] = useState(false);

  const name = locale === 'he' ? entry.nameHe : entry.nameEn;
  const unitLabel = t(`unit.${entry.unit}`);
  const qty =
    entry.unit === 'to_taste'
      ? unitLabel
      : `${entry.quantity % 1 === 0 ? entry.quantity : entry.quantity} ${unitLabel}`;

  return (
    <li
      className={`flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 cursor-pointer select-none group`}
      onClick={() => setChecked((v) => !v)}
    >
      <span
        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-colors"
        style={{
          border: `2px solid ${checked ? '#14422d' : '#c0c9c1'}`,
          background: checked ? '#14422d' : 'transparent',
          color: '#ffffff',
        }}
      >
        {checked && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      <span className="flex-1 text-sm transition-all" style={{ textDecoration: checked ? 'line-through' : 'none', color: checked ? '#b0b8b2' : '#1a1c1b' }}>
        {name}
        {entry.optional && (
          <span className="ms-1 text-xs text-gray-400">({t('shopping.optional')})</span>
        )}
      </span>

      <span className="text-sm font-medium whitespace-nowrap transition-all" style={{ color: checked ? '#c0c9c1' : '#14422d' }}>
        {qty}
      </span>
    </li>
  );
}
