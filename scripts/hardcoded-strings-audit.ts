// Hardcoded UI strings audit — generated overnight-polish
// Each entry: { file, key, he, en }
// Purpose: track strings that should flow through the i18n system in a future migration.
// Some have already been fixed inline; others are listed here for awareness.

export const HARDCODED_STRINGS_AUDIT = [
  // ── Already fixed inline ────────────────────────────────────────────────────
  { file: 'src/components/recipes/RecipeCard.tsx',   key: 'save_recipe',        he: 'שמור מתכון',        en: 'Save recipe',        status: 'fixed' },
  { file: 'src/components/recipes/RecipeCard.tsx',   key: 'remove_recipe',      he: 'הסר מתכון',         en: 'Remove recipe',      status: 'fixed' },
  { file: 'src/components/layout/Header.tsx',        key: 'open_menu',          he: 'פתח תפריט',         en: 'Open menu',          status: 'fixed' },
  { file: 'src/components/ui/MealPlanPanel.tsx',     key: 'close_panel',        he: 'סגור',              en: 'Close',              status: 'fixed' },
  { file: 'src/components/ui/MealPlanPanel.tsx',     key: 'remove_from_plan',   he: 'הסר מהתוכנית',      en: 'Remove from plan',   status: 'fixed' },

  // ── Present in codebase — review for future i18n ────────────────────────────
  { file: 'src/app/planner/page.tsx',               key: 'search_recipe',       he: 'חפש מתכון...',      en: 'Search recipe...',   status: 'reviewed' },
  { file: 'src/app/planner/page.tsx',               key: 'start_mealprep',      he: 'התחל מילפרפ',       en: 'Start meal prep',    status: 'reviewed' },
  { file: 'src/app/planner/page.tsx',               key: 'start_cooking',       he: 'התחל בישול',        en: 'Start cooking',      status: 'reviewed' },
  { file: 'src/app/planner/page.tsx',               key: 'shopping_list',       he: 'רשימת קניות',       en: 'Shopping list',      status: 'reviewed' },
  { file: 'src/app/planner/page.tsx',               key: 'prep_for',            he: 'מכין עבור',         en: 'Cooking for',        status: 'reviewed' },
  { file: 'src/app/planner/page.tsx',               key: 'people',              he: 'אנשים',             en: 'people',             status: 'reviewed' },
  { file: 'src/app/checklist/page.tsx',             key: 'meal_prep_planner',   he: 'תכנון מילפרפ',      en: 'Meal Prep Planner',  status: 'reviewed' },
  { file: 'src/app/mealprep/page.tsx',              key: 'recipe_selection',    he: 'בחירת מתכונים',     en: 'Recipe selection',   status: 'reviewed' },
  { file: 'src/app/ingredients/page.tsx',           key: 'fridge_search',       he: 'חפש מוצרים...',     en: 'Search ingredients', status: 'reviewed' },
  { file: 'src/app/profile/page.tsx',               key: 'save_profile',        he: 'שמור פרופיל',       en: 'Save profile',       status: 'reviewed' },
  { file: 'src/components/recipes/StepByStep.tsx',  key: 'next_step',           he: 'שלב הבא',           en: 'Next step',          status: 'reviewed' },
  { file: 'src/components/recipes/StepByStep.tsx',  key: 'prev_step',           he: 'שלב קודם',          en: 'Previous step',      status: 'reviewed' },
  { file: 'src/components/ui/FeedbackModal.tsx',    key: 'send_feedback',       he: 'שלח משוב',          en: 'Send feedback',      status: 'reviewed' },
  { file: 'src/components/ui/WelcomeModal.tsx',     key: 'start_tour',          he: 'התחלת סיור',        en: 'Start tour',         status: 'reviewed' },
  { file: 'src/components/ui/WelcomeModal.tsx',     key: 'explore_alone',       he: 'אני רוצה לגלות לבד', en: 'Explore on my own', status: 'reviewed' },
];
