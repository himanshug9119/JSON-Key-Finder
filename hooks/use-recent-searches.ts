'use client';

import { useState, useEffect } from 'react';
import { RecentSearch, SearchResult } from '@/lib/types';

const MAX_RECENT_SEARCHES = 10;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const addRecentSearch = (key: string, results: SearchResult[]) => {
    const newSearch: RecentSearch = {
      id: Math.random().toString(36).substr(2, 9),
      key,
      timestamp: Date.now(),
      results,
    };

    const updated = [newSearch, ...recentSearches].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}