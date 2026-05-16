'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Recipe } from '@/types';
import { recipes } from '@/data/recipes';

interface MealPlanContextType {
  selectedIds: Set<string>;
  portions: Record<string, number>;
  selectedRecipes: Recipe[];
  isSelected: (id: string) => boolean;
  toggleRecipe: (id: string) => void;
  removeRecipe: (id: string) => void;
  setPortion: (id: string, value: number) => void;
  adjustPortion: (id: string, delta: number) => void;
  getPortion: (recipe: Recipe) => number;
  clear: () => void;
}

const MealPlanContext = createContext<MealPlanContextType | null>(null);

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [portions, setPortions] = useState<Record<string, number>>({});

  const selectedRecipes = recipes.filter((r) => selectedIds.has(r.id));

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggleRecipe = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const removeRecipe = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPortions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const getPortion = useCallback((recipe: Recipe) => {
    return portions[recipe.id] ?? recipe.baseServings * 5;
  }, [portions]);

  const setPortion = useCallback((id: string, value: number) => {
    setPortions((prev) => ({ ...prev, [id]: Math.max(1, Math.min(50, value)) }));
  }, []);

  const adjustPortion = useCallback((id: string, delta: number) => {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return;
    setPortions((prev) => {
      const current = prev[id] ?? recipe.baseServings * 5;
      return { ...prev, [id]: Math.max(1, Math.min(50, current + delta)) };
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    setPortions({});
  }, []);

  return (
    <MealPlanContext.Provider value={{
      selectedIds,
      portions,
      selectedRecipes,
      isSelected,
      toggleRecipe,
      removeRecipe,
      setPortion,
      adjustPortion,
      getPortion,
      clear,
    }}>
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error('useMealPlan must be used within MealPlanProvider');
  return ctx;
}
