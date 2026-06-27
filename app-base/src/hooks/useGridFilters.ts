import { useState, useCallback } from 'react';

export interface GridFilters {
  onlineOnly: boolean;
  hasPicOnly: boolean;
  prefFilters: Record<string, string>;
}

export interface UseGridFiltersReturn {
  filters: GridFilters;
  setOnlineOnly: (value: boolean) => void;
  setHasPicOnly: (value: boolean) => void;
  setPrefFilter: (key: string, value: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const DEFAULT_PREF_FILTERS = {
  safety: 'Ask me',
  party: 'Ask me',
  location: 'All',
  role: 'All',
};

export function useGridFilters(initialFilters) {
  const [onlineOnly, setOnlineOnly] = useState(initialFilters?.onlineOnly ?? false);
  const [hasPicOnly, setHasPicOnly] = useState(initialFilters?.hasPicOnly ?? false);
  const [prefFilters, setPrefFilters] = useState(initialFilters?.prefFilters ?? DEFAULT_PREF_FILTERS);

  const setPrefFilter = useCallback((key, value) => {
    setPrefFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setOnlineOnly(false);
    setHasPicOnly(false);
    setPrefFilters(DEFAULT_PREF_FILTERS);
  }, []);

  const hasActiveFilters = onlineOnly || hasPicOnly || Object.values(prefFilters).some(v => v !== 'Ask me' && v !== 'All');

  return {
    filters: { onlineOnly, hasPicOnly, prefFilters },
    setOnlineOnly,
    setHasPicOnly,
    setPrefFilter,
    resetFilters,
    hasActiveFilters,
  };
}
