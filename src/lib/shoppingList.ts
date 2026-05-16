import { Recipe, ShoppingListEntry } from '@/types';

export function roundQuantity(value: number): number {
  if (value === 0) return 0;
  if (value >= 10) return Math.round(value);
  // Round to nearest 0.5 for small quantities
  return Math.round(value * 2) / 2;
}

export function calculateShoppingList(
  recipe: Recipe,
  desiredPortions: number
): ShoppingListEntry[] {
  const multiplier = desiredPortions / recipe.baseServings;

  return recipe.ingredients.map((ing) => ({
    nameHe: ing.nameHe,
    nameEn: ing.nameEn,
    quantity: roundQuantity(ing.quantity * multiplier),
    unit: ing.unit,
    optional: ing.optional ?? false,
    shoppingCategory: ing.shoppingCategory,
  }));
}

export function mergeShoppingLists(lists: ShoppingListEntry[][]): ShoppingListEntry[] {
  const map = new Map<string, ShoppingListEntry>();
  for (const list of lists) {
    for (const item of list) {
      const key = `${item.nameHe}__${item.unit}`;
      if (map.has(key)) {
        map.get(key)!.quantity = roundQuantity(map.get(key)!.quantity + item.quantity);
      } else {
        map.set(key, { ...item });
      }
    }
  }
  return Array.from(map.values());
}

export const SHOPPING_CATEGORY_ORDER: import('@/types').ShoppingCategory[] = [
  'protein',
  'vegetables',
  'dairy',
  'grains',
  'spices',
  'other',
];

export function groupByCategory(
  items: ShoppingListEntry[]
): Record<string, ShoppingListEntry[]> {
  const groups: Record<string, ShoppingListEntry[]> = {};
  for (const item of items) {
    const cat = item.shoppingCategory ?? 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}
