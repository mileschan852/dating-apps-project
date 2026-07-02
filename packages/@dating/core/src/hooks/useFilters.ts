import { useState, useCallback, useMemo } from 'react';
import type { PreferenceFilterConfig } from '../types/preferenceFilters';

export function useFilters(
  configs: PreferenceFilterConfig[],
  hasFilterUnlockSubscription: boolean
) {
  const initialValues = useMemo(() => {
    const vals: Record<string, any> = {};
    configs.forEach(config => {
      vals[config.type] = config.default;
    });
    return vals;
  }, [configs]);

  const [values, setValues] = useState<Record<string, any>>(initialValues);

  const setFilter = useCallback((key: string, value: any) => {
    const config = configs.find(c => c.type === key);
    if (!config) return;

    // Block switching to locked options unless user has subscription
    if (!config.unlocked && !hasFilterUnlockSubscription) {
      return;
    }

    setValues(prev => ({
      ...prev,
      [key]: value
    }));
  }, [configs, hasFilterUnlockSubscription]);

  const resetFilters = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return {
    values,
    setFilter,
    resetFilters
  };
}
