import { useState, useCallback } from 'react';

export interface GridFilters {
  onlineOnly: boolean;
  hasPicOnly: boolean;
  /** App-specific preference filters — empty in template, populated by HKMO etc. */
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

export interface UseGridFiltersOptions {
  /** Initial preference filter defaults — apps pass their own defaults here */
  defaultPrefFilters?: Record<string, string>;
}

export function useGridFilters(options: UseGridFiltersOptions = {}): UseGridFiltersReturn {
  const { defaultPrefFilters = {} } = options;

  const [onlineOnly, setOnlineOnly] = useState(false);
  const [hasPicOnly, setHasPicOnly] = useState(false);
  const [prefFilters, setPrefFilters] = useState<Record<string, string>>(defaultPrefFilters);

  const setPrefFilter = useCallback((key: string, value: string) => {
    setPrefFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setOnlineOnly(false);
    setHasPicOnly(false);
    setPrefFilters(defaultPrefFilters);
  }, [defaultPrefFilters]);

  const hasActiveFilters =
    onlineOnly ||
    hasPicOnly ||
    Object.values(prefFilters).some((v) => v !== '' && v !== 'All' && v !== 'Ask me');

  return {
    filters: { onlineOnly, hasPicOnly, prefFilters },
    setOnlineOnly,
    setHasPicOnly,
    setPrefFilter,
    resetFilters,
    hasActiveFilters,
  };
}
