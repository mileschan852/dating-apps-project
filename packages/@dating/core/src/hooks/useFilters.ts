// packages/@dating/core/src/hooks/useFilters.ts
import { useState, useCallback } from 'react';
import type { PreferenceFiltersConfig } from '../types/preferenceFilters';

export interface FilterState {
  onlineOnly: boolean;
  hasPicOnly: boolean;
  preferences: Record<string, any>;
}

interface UseFiltersOptions {
  config: PreferenceFiltersConfig;
  initialState?: Partial<FilterState>;
  hasFilterUnlockSubscription?: boolean;
}

export function useFilters({
  config,
  initialState = {},
  hasFilterUnlockSubscription = false,
}: UseFiltersOptions) {
  const [onlineOnly, setOnlineOnly] = useState(initialState.onlineOnly ?? false);
  const [hasPicOnly, setHasPicOnly] = useState(initialState.hasPicOnly ?? false);

  const getInitialPreferences = (): Record<string, any> => {
    const prefs: Record<string, any> = {};

    Object.entries(config).forEach(([key, filter]) => {
      if (initialState.preferences?.[key] !== undefined) {
        prefs[key] = initialState.preferences[key];
      } else if (filter.default !== undefined) {
        prefs[key] = filter.default;
      } else if (filter.allowAll) {
        prefs[key] = 'all';
      } else if (filter.options && filter.options.length > 0) {
        prefs[key] = filter.options[0].value;
      }
    });

    return prefs;
  };

  const [preferences, setPreferences] = useState<Record<string, any>>(getInitialPreferences());

  const toggleOnline = useCallback(() => setOnlineOnly((prev) => !prev), []);
  const toggleHasPic = useCallback(() => setHasPicOnly((prev) => !prev), []);

  const setPreference = useCallback(
    (key: string, value: any) => {
      const filterConfig = config[key];
      if (!filterConfig) return;

      // Block switching to locked options unless user has unlock subscription
      if (!hasFilterUnlockSubscription && filterConfig.options) {
        const targetOption = filterConfig.options.find((o) => o.value === value);
        if (targetOption?.unlocked === false) {
          return;
        }
      }

      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    [config, hasFilterUnlockSubscription]
  );

  const resetFilters = useCallback(() => {
    setOnlineOnly(false);
    setHasPicOnly(false);
    setPreferences(getInitialPreferences());
  }, [config]);

  return {
    onlineOnly,
    hasPicOnly,
    toggleOnline,
    toggleHasPic,
    preferences,
    setPreference,
    resetFilters,
    config,
  };
}
