'use client';

import { ShoppingListEntry } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import ShoppingItem from './ShoppingItem';

interface Props {
  entries: ShoppingListEntry[];
  recipeName: string;
  portions: number;
}

export default function ShoppingList({ entries, recipeName, portions }: Props) {
  const { t } = useLanguage();

  const required = entries.filter((e) => !e.optional);
  const optional = entries.filter((e) => e.optional);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('shopping.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {recipeName} — {portions} {t('shopping.portions')}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-emerald-700 border border-gray-200 hover:border-emerald-300 rounded-lg px-3 py-1.5 transition-colors print:hidden"
        >
          🖨 {t('shopping.print')}
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-5">{t('shopping.tip')}</p>

      {/* Required items */}
      <ul>
        {required.map((entry, i) => (
          <ShoppingItem key={i} entry={entry} />
        ))}
      </ul>

      {/* Optional items */}
      {optional.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {t('shopping.optional')}
          </p>
          <ul>
            {optional.map((entry, i) => (
              <ShoppingItem key={i} entry={entry} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
