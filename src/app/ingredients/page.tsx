'use client';

import { useState, useMemo, useRef, KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { recipes } from '@/data/recipes';
import { Recipe } from '@/types';

// ─── Matching logic ────────────────────────────────────────────────────────────

function normalizeToken(s: string) {
  return s.trim().toLowerCase()
    .replace(/['"״׳]/g, '')          // strip quotes
    .replace(/ים$|ות$|ת$|ה$/, '');  // strip common Hebrew plurals/feminines
}

interface MatchResult {
  recipe: Recipe;
  matchedTokens: string[];           // which user tokens matched
  matchedIngredients: string[];      // which ingredient names matched
  score: number;                     // 0-1
}

function matchRecipes(tokens: string[], allRecipes: Recipe[]): MatchResult[] {
  if (tokens.length === 0) return [];

  const normalizedTokens = tokens.map(normalizeToken).filter(t => t.length >= 2);
  if (normalizedTokens.length === 0) return [];

  const results: MatchResult[] = [];

  for (const recipe of allRecipes) {
    const matchedTokens: string[] = [];
    const matchedIngredients: string[] = [];

    for (const token of normalizedTokens) {
      for (const ing of recipe.ingredients) {
        const heNorm = normalizeToken(ing.nameHe);
        const enNorm = normalizeToken(ing.nameEn);
        if (heNorm.includes(token) || enNorm.includes(token) ||
            token.includes(heNorm.slice(0, Math.max(3, heNorm.length - 1))) ||
            token.includes(enNorm.slice(0, Math.max(3, enNorm.length - 1)))) {
          if (!matchedTokens.includes(token)) matchedTokens.push(token);
          if (!matchedIngredients.includes(ing.nameHe)) matchedIngredients.push(ing.nameHe);
        }
      }
    }

    if (matchedTokens.length > 0) {
      results.push({
        recipe,
        matchedTokens,
        matchedIngredients,
        score: matchedTokens.length / normalizedTokens.length,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score || b.matchedTokens.length - a.matchedTokens.length);
}

// ─── Suggestion pool (common ingredients in Hebrew) ───────────────────────────

const SUGGESTIONS = [
  'עוף', 'טופו', 'סלמון', 'הודו', 'טונה', 'ביצה', 'ביצים',
  'בצל', 'שום', 'עגבניות', 'לימון', 'פטרוזיליה',
  'שיבולת שועל', 'שעועית', 'קורנפלור',
  'שמן זית', 'פפריקה', 'כמון', 'רסק עגבניות',
  'חלב', 'סילאן',
];

// ─── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct === 100 ? '#2A4F3A' : pct >= 60 ? '#C9572A' : '#6B6560';
  const bg   = pct === 100 ? '#EBF2ED' : pct >= 60 ? '#FBF0EB' : '#F0EBE3';
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px',
      borderRadius: 9999, background: bg, color,
      flexShrink: 0,
    }}>
      {pct === 100 ? '✓ התאמה מלאה' : `${pct}% התאמה`}
    </span>
  );
}

// ─── Recipe result card ────────────────────────────────────────────────────────

function ResultCard({ result }: { result: MatchResult }) {
  const { locale } = useLanguage();
  const { recipe, matchedIngredients, score } = result;
  const name = locale === 'he' ? recipe.nameHe : recipe.nameEn;

  return (
    <Link href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', gap: 14, padding: 16,
        background: '#fff', border: '1px solid #E0D9CE', borderRadius: 16,
        transition: 'box-shadow 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,25,24,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        {/* Image */}
        <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
          <Image src={recipe.image} alt={name} fill sizes="80px" style={{ objectFit: 'cover' }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1918', margin: 0, lineHeight: 1.3 }}>{name}</h3>
            <ScoreBadge score={score} />
          </div>

          {/* Time + storage */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(26,25,24,0.45)' }}>
              {recipe.prepTimeMin + recipe.cookTimeMin} דק׳
            </span>
            <span style={{ fontSize: 11, color: 'rgba(26,25,24,0.45)' }}>
              שמירה {recipe.storageDays} ימים
            </span>
          </div>

          {/* Matched ingredients */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {matchedIngredients.map(ing => (
              <span key={ing} style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 9999,
                background: '#EBF2ED', color: '#2A4F3A',
                fontWeight: 600,
              }}>
                ✓ {ing.split('(')[0].trim()}
              </span>
            ))}
            {recipe.ingredients.length - matchedIngredients.length > 0 && (
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 9999,
                background: '#F0EBE3', color: 'rgba(26,25,24,0.45)',
              }}>
                +{recipe.ingredients.filter(i => !matchedIngredients.includes(i.nameHe)).length} מרכיבים נוספים
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function IngredientsPage() {
  const { locale } = useLanguage();
  const isHe = locale === 'he';

  const [chips, setChips] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addChip = (val: string) => {
    const trimmed = val.trim().replace(/,$/, '').trim();
    if (trimmed && !chips.includes(trimmed)) {
      setChips(prev => [...prev, trimmed]);
    }
    setInputVal('');
  };

  const removeChip = (chip: string) => setChips(prev => prev.filter(c => c !== chip));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && inputVal.trim().length >= 2) {
      e.preventDefault();
      addChip(inputVal);
    }
    if (e.key === 'Backspace' && !inputVal && chips.length > 0) {
      setChips(prev => prev.slice(0, -1));
    }
  };

  const results = useMemo(() => matchRecipes(chips, recipes), [chips]);

  const perfectMatches = results.filter(r => r.score === 1);
  const partialMatches = results.filter(r => r.score < 1);

  const activeSuggestions = SUGGESTIONS.filter(s => !chips.includes(s));

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F7F3EE' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 14, background: '#EBF2ED', marginBottom: 14,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2A4F3A" strokeWidth="1.8">
              <path d="M3 3h7l2 3H21a1 1 0 0 1 .95 1.32l-2.5 8A1 1 0 0 1 18.5 16H7l-1 3H3"/>
              <circle cx="9" cy="21" r="1" fill="#2A4F3A" stroke="none"/>
              <circle cx="19" cy="21" r="1" fill="#2A4F3A" stroke="none"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1918', margin: '0 0 8px' }}>
            מה יש לי במקרר?
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(26,25,24,0.5)', margin: 0, lineHeight: 1.5 }}>
            הקלד מרכיבים שיש לך ותקבל מתכונים שמתאימים בדיוק לזה
          </p>
        </div>

        {/* Chip input box */}
        <div
          style={{
            background: '#fff', border: '2px solid #E0D9CE', borderRadius: 16,
            padding: '12px 14px', marginBottom: 16, cursor: 'text',
            transition: 'border-color 0.15s',
          }}
          onClick={() => inputRef.current?.focus()}
          onFocus={() => {/* handled by inner input */}}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
            {chips.map(chip => (
              <span key={chip} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px 4px 6px', borderRadius: 9999,
                background: '#2A4F3A', color: '#fff',
                fontSize: 13, fontWeight: 600,
              }}>
                {chip}
                <button
                  onClick={(e) => { e.stopPropagation(); removeChip(chip); }}
                  style={{
                    background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff',
                    width: 16, height: 16, borderRadius: '50%', fontSize: 11,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1, padding: 0,
                  }}
                >×</button>
              </span>
            ))}
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (inputVal.trim().length >= 2) addChip(inputVal); }}
              placeholder={chips.length === 0 ? 'למשל: עוף, בצל, שום... (Enter או פסיק להוסיף)' : ''}
              style={{
                flex: 1, minWidth: 180, border: 'none', outline: 'none',
                fontSize: 14, color: '#1A1918', background: 'transparent',
                direction: 'rtl', padding: '2px 0',
              }}
            />
          </div>
        </div>

        {/* Suggestions */}
        {chips.length < 6 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, color: 'rgba(26,25,24,0.4)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>
              הצעות נפוצות:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {activeSuggestions.slice(0, 14).map(s => (
                <button
                  key={s}
                  onClick={() => { setChips(prev => [...prev, s]); inputRef.current?.focus(); }}
                  style={{
                    padding: '5px 12px', borderRadius: 9999,
                    border: '1px solid #E0D9CE', background: '#F7F3EE',
                    fontSize: 12, color: '#6B6560', cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2A4F3A'; e.currentTarget.style.color = '#2A4F3A'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D9CE'; e.currentTarget.style.color = '#6B6560'; }}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clear all */}
        {chips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.5)', margin: 0 }}>
              {results.length > 0
                ? `נמצאו ${results.length} מתכונים עם "${chips.join(', ')}"`
                : `לא נמצאו מתכונים עם "${chips.join(', ')}"`}
            </p>
            <button
              onClick={() => { setChips([]); setInputVal(''); }}
              style={{
                fontSize: 12, color: '#C9572A', background: 'none', border: 'none',
                cursor: 'pointer', fontWeight: 600, padding: 0,
              }}
            >
              נקה הכל
            </button>
          </div>
        )}

        {/* Empty state */}
        {chips.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(26,25,24,0.3)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🥦</div>
            <p style={{ fontSize: 14 }}>הוסף מרכיבים שיש לך כדי למצוא מתכונים</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Perfect matches */}
            {perfectMatches.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 1, background: '#E0D9CE' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2A4F3A', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    ✓ כל המרכיבים קיימים
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#E0D9CE' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {perfectMatches.map(r => <ResultCard key={r.recipe.id} result={r} />)}
                </div>
              </div>
            )}

            {/* Partial matches */}
            {partialMatches.length > 0 && (
              <div>
                {perfectMatches.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 1, background: '#E0D9CE' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6B6560', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                      התאמה חלקית
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#E0D9CE' }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {partialMatches.map(r => <ResultCard key={r.recipe.id} result={r} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No results */}
        {chips.length > 0 && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤷</div>
            <p style={{ fontSize: 14, color: 'rgba(26,25,24,0.5)', marginBottom: 4 }}>
              לא נמצאו מתכונים עם המרכיבים שהזנת
            </p>
            <p style={{ fontSize: 12, color: 'rgba(26,25,24,0.35)' }}>
              נסה מרכיבים אחרים או הסר אחד מהתנאים
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
