'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { fetchSavedRecipes, pushSavedRecipes } from '@/lib/userDataApi';

const STORAGE_KEY = 'easyprep_saved_recipes';

interface SavedContextValue {
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
}

const SavedContext = createContext<SavedContextValue>({
  savedIds: [],
  isSaved: () => false,
  toggleSaved: () => {},
});

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    // 1. Load from localStorage immediately
    try {
      setSavedIds(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
    } catch {}

    // 2. Sync from Supabase if signed in
    if (!isLoaded || !isSignedIn) return;
    fetchSavedRecipes().then((ids) => {
      setSavedIds(ids);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }).catch(() => {});
  }, [isSignedIn, isLoaded]);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (isSignedIn) pushSavedRecipes(next).catch(() => {});
      return next;
    });
  }, [isSignedIn]);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  return (
    <SavedContext.Provider value={{ savedIds, isSaved, toggleSaved }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  return useContext(SavedContext);
}
