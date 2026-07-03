'use client';

import { ShoppingListEntry } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { groupByCategory, SHOPPING_CATEGORY_ORDER } from '@/lib/shoppingList';
import { Beef, Leaf, Droplets, Wheat, Flame, ShoppingBag } from 'lucide-react';

function getCategoryIcon(cat: string) {
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

      {/* 2-column category card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {SHOPPING_CATEGORY_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
          <div key={cat} style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '16px',
            boxShadow: '0 2px 12px rgba(45,90,67,0.06)',
            border: '1px solid #efeeec',
          }}>
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'flex', alignItems: 'center', color: '#6B6560' }}>{getCategoryIcon(cat)}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1c1b' }}>
                  {CATEGORY_LABEL[cat]}
                </span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#14422d',
                background: 'rgba(20,66,45,0.08)',
                borderRadius: 9999, padding: '2px 8px',
              }}>
                {grouped[cat].length}
              </span>
            </div>
            {/* Items */}
            {grouped[cat].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < grouped[cat].length - 1 ? '1px solid #f0ede9' : 'none' }}>
                <span style={{ fontSize: 13, color: '#1a1c1b' }}>
                  {isHe ? item.nameHe : item.nameEn}
                  {item.optional && <span style={{ fontSize: 11, color: '#b0b8b2', marginInlineStart: 4 }}>(אופציונלי)</span>}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#414943', whiteSpace: 'nowrap', marginInlineStart: 8 }}>
                  {item.quantity} {item.unit !== 'unit' ? t(`unit.${item.unit}`) : ''}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
