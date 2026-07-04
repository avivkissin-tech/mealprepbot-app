# Overnight Polish Report
Branch: `overnight-polish` | Date: 2026-07-04

## Summary
Comprehensive polish pass covering RTL CSS logical properties, hardcoded-string audit, mobile 375px layout fixes, and skeleton loading states. All changes are committed on `overnight-polish`. `npm run build` passes clean with zero TypeScript errors or warnings.

---

## Phase 2a — CSS Logical Properties

### Changes made
| File | Change |
|------|--------|
| `src/app/layout.tsx` | `md:pr-[240px]` → `md:pe-[240px]` |
| `src/components/shopping/ShoppingList.tsx` | 2× `marginRight` → `marginInlineStart` |
| `src/components/recipes/IngredientList.tsx` | `marginRight: 4` → `marginInlineStart: 4` |
| `src/components/recipes/MealPrepSession.tsx` | 2× `marginRight` → `marginInlineStart` |
| `src/app/planner/page.tsx` | `marginRight: 4` → `marginInlineStart: 4` |
| `src/components/ui/SidePanel.tsx` | `marginRight: 'auto', marginLeft: 'auto'` → `marginInline: 'auto'` |
| `src/app/onboarding/page.tsx` | 2× `marginRight: 8` → `marginInlineStart: 8` |
| `src/app/studio/StudioClient.tsx` | `marginRight: 8` → `marginInlineStart: 8` |
| `src/components/layout/Sidebar.tsx` | Physical `padding` shorthand → `paddingBlock` / `paddingInlineStart` / `paddingInlineEnd` |

**Skipped** (intentionally): `left: 0` / `right: 0` in fixed/absolute overlays, sidebar anchor, modals, SVGs — these are layout anchors that must stay physical.

### Files changed: 9

---

## Phase 2b — Hardcoded English Strings

### Strings fixed inline
| File | String | Fix |
|------|--------|-----|
| `src/components/recipes/RecipeCard.tsx` | `aria-label="Save recipe"` | → `aria-label={isHe ? 'שמור מתכון' : 'Save recipe'}` |
| `src/components/recipes/RecipeCard.tsx` | `aria-label="Remove recipe"` | → `aria-label={isHe ? 'הסר מתכון' : 'Remove recipe'}` |
| `src/components/layout/Header.tsx` | `aria-label="Open menu"` | → `aria-label={isHe ? 'פתח תפריט' : 'Open menu'}` |
| `src/components/ui/MealPlanPanel.tsx` | `aria-label="Close"` | → bilingual |
| `src/components/ui/MealPlanPanel.tsx` | `aria-label="Remove from plan"` | → bilingual |

### Audit file
`src/data/hardcoded-strings-audit.ts` — lists 20 strings with their He/En alternatives and status (`fixed` or `reviewed`). This is a living document for the next i18n migration sprint.

---

## Phase 2c — Mobile 375px Fixes

### Issues found and fixed
| File | Issue | Fix |
|------|-------|-----|
| `src/app/dashboard/page.tsx` | Recipe grid `minmax(200px, 1fr)` — too wide for 375px, only 1 column possible | → `minmax(150px, 1fr)` — allows 2 columns at 375px |
| `src/app/dashboard/page.tsx` | Recommended recipes grid same issue | → `minmax(150px, 1fr)` |
| `src/components/ui/SiteTour.tsx` | Tooltip `width: 308` could overflow on narrow screens | → `width: 'min(308px, calc(100vw - 32px))'` |

**Already fine (verified):**
- Filter chips: `overflowX: 'auto'` + `scrollbarWidth: 'none'` ✓
- Planner 7-day grid: hidden on mobile, shows tab strip + single-day view instead ✓
- Hero CTA buttons: `flexWrap: 'wrap'` ✓
- Recipe picker modal: `position: fixed, bottom: 0` sheet — no overflow ✓

---

## Phase 2d — Skeletons & Empty States

### New component
`src/components/ui/Skeleton.tsx` — exports `Skeleton` (generic) and `RecipeCardSkeleton` (full card shape with shimmer animation).

### CSS animation
`src/app/globals.css` — added `@keyframes skeleton-shimmer` for the 200% gradient sweep.

### Components updated
| Component | Change |
|-----------|--------|
| `src/app/dashboard/page.tsx` | When `filteredRecipes.length === 0` AND no search/filter active → show 8 `RecipeCardSkeleton` cards instead of empty space |
| `src/app/dashboard/page.tsx` | When search/filter active AND 0 results → show `"לא נמצאו מתכונים — נסו חיפוש אחר"` (was: generic "no recipes" in Hebrew only) |

**Skipped:**
- Planner skeleton: the planner page handles `!isLoaded` state by showing the full grid with empty slots (which is already clear UI). Adding a skeleton here was judged as adding noise rather than value.
- Checklist: recipes come from static array, no async loading. No skeleton needed.

---

## Before/After Screenshots
Screenshots were not taken in this pass (Playwright was not installed and the dev server was not started to avoid port conflicts). The code changes are all committed and verifiable with `npm run dev`.

---

## Decisions Required (do NOT act on these without user input)

1. **Planner skeleton**: Should the planner page show skeleton columns while `isLoaded === false` (Clerk auth loading)? Currently it renders full empty columns immediately. Skeleton would be ~20 lines of code.

2. **Recipe image placeholder**: `/public/images/recipes/pulled-chicken-curry.png` is referenced by the new recipe but the file does not exist yet. All recipe cards with missing images fall back to a broken image. Should we add a placeholder image, or will the real photo be supplied?

3. **Dark-mode RecipeCard background**: `RecipeCard` in `dashboard/page.tsx` has `background: '#fff'` hardcoded. In dark mode this renders as a white card. Should it use `var(--bg-surface)` or `var(--card-bg)` instead?

4. **Shopping list empty state emoji**: `planner/page.tsx` line 881 still has a `🛒` emoji in the shopping list empty state. Replace with Lucide `ShoppingCart` icon?

5. **Planner "Start mealprep" button emoji**: `planner/page.tsx` lines 236 and 280 have `🍳 התחל מילפרפ`. Replace with a Lucide icon (e.g. `<Utensils />`) per the no-emoji-in-UI rule?

6. **Hardcoded-strings-audit.ts**: This file is for developer reference only. Should it be exported to the app bundle at all, or moved to a `scripts/` folder outside `src/`?
