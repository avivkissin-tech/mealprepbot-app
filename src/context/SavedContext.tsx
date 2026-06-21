'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

  useEffect(() => {
    try {
      setSavedIds(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
    } catch {}
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

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
