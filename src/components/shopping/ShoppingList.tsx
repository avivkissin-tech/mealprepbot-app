'use client';

import { ShoppingListEntry } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { groupByCategory, SHOPPING_CATEGORY_ORDER } from '@/lib/shoppingList';

const CATEGORY_ICON: Record<string, string> = {
  protein: '🥩', vegetables: '🥦', dairy: '🥛',
  grains: '🌾', spices: '🧂', other: '🛒',
};

const CATEGORY_LABEL: Record<string, string> = {
  protein: 'חלבונים', vegetables: 'ירקות', dairy: 'חלב ומוצריו',
  grains: 'דגנים', spices: 'תבלינים', other: 'שונות',
};

interface Props {
  entries: ShoppingListEntry[];
  recipeName: string;
  portions: number;
}

export default function ShoppingList({ entries, recipeName, portions }: Props) {
  const { t, locale } = useLanguage();
  const isHe = locale === 'he';

  const grouped = groupByCategory(entries);

  return (
    <div dir="rtl">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1c1b', margin: 0 }}>{t('shopping.title')}</h1>
          <p style={{ fontSize: 13, color: '#717973', marginTop: 4 }}>
            {recipeName} — {portions} {t('shopping.portions')}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            color: '#717973', background: 'none',
            border: '1px solid #e0d9ce', borderRadius: 8, padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          🖨 {t('shopping.print')}
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#b0b8b2', marginBottom: 24 }}>{t('shopping.tip')}</p>

      {/* Grouped by category */}
      {SHOPPING_CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
        <div key={cat} style={{ marginBottom: 24 }}>
          {/* Category header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 15 }}>{CATEGORY_ICON[cat]}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#717973',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {CATEGORY_LABEL[cat]}
            </span>
          </div>
          {/* Items */}
          {grouped[cat].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 0', borderBottom: '1px solid #f0ebe3',
            }}>
              <span style={{ fontSize: 14, color: '#1a1c1b' }}>
                {isHe ? item.nameHe : item.nameEn}
                {item.optional && (
                  <span style={{ fontSize: 11, color: '#b0b8b2', marginRight: 4 }}>(אופציונלי)</span>
                )}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#14422d', flexShrink: 0 }}>
                {item.quantity > 0 ? `${item.quantity} ${item.unit}` : item.unit}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
