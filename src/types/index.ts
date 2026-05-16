export type Locale = 'he' | 'en';

export type RecipeCategory =
  | 'fish'
  | 'chicken'
  | 'turkey'
  | 'tofu'
  | 'breakfast'
  | 'beef'
  | 'salad'
  | 'side';

export type DietaryTag =
  | 'vegan'
  | 'vegetarian'
  | 'gluten-free'
  | 'dairy-free'
  | 'high-protein'
  | 'low-carb';

export type Unit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'cup'
  | 'tbsp'
  | 'tsp'
  | 'unit'
  | 'can'
  | 'pinch'
  | 'to_taste';

export type ShoppingCategory =
  | 'vegetables'
  | 'protein'
  | 'dairy'
  | 'grains'
  | 'spices'
  | 'other';

export interface Ingredient {
  nameHe: string;
  nameEn: string;
  quantity: number;
  unit: Unit;
  optional?: boolean;
  shoppingCategory?: ShoppingCategory;
}

export interface PrepStep {
  he: string;
  en: string;
  /** Duration in minutes — shows a countdown timer button next to this step */
  timerMinutes?: number;
}

export interface NutritionPerServing {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
}

export interface Recipe {
  id: string;
  nameHe: string;
  nameEn: string;
  descriptionHe: string;
  descriptionEn: string;
  category: RecipeCategory;
  image: string;
  baseServings: number;
  prepTimeMin: number;
  cookTimeMin: number;
  storageDays: number;
  ingredients: Ingredient[];
  steps: PrepStep[];
  tags: string[];
  dietaryTags?: DietaryTag[];
  chefName?: string;
  /** Optional nutrition info per serving — used for portion calculations */
  nutritionPerServing?: NutritionPerServing;
}

export interface ChecklistItem {
  id: number;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
}

export interface ShoppingListEntry {
  nameHe: string;
  nameEn: string;
  quantity: number;
  unit: Unit;
  optional: boolean;
  shoppingCategory?: ShoppingCategory;
}
