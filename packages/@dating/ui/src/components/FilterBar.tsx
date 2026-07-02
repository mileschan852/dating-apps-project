import React from 'react';
import { PreferenceFilter } from './PreferenceFilter';
import type { PreferenceFilterConfig } from '../../dating-core/types/preferenceFilters';

interface FilterBarProps {
  configs: PreferenceFilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  hasFilterUnlockSubscription: boolean;
  onLockedFilterClick: () => void;
  dividingIndex?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  configs,
  values,
  onChange,
  hasFilterUnlockSubscription,
  onLockedFilterClick,
  dividingIndex = 2,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-3">
        {configs.slice(0, dividingIndex).map((config) => (
          <PreferenceFilter
            key={config.type}
            config={config}
            value={values[config.type]}
            onChange={(val) => onChange(config.type, val)}
            showLock={!config.unlocked && !hasFilterUnlockSubscription}
            onLockedFilterClick={onLockedFilterClick}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {configs.slice(dividingIndex).map((config) => (
          <PreferenceFilter
            key={config.type}
            config={config}
            value={values[config.type]}
            onChange={(val) => onChange(config.type, val)}
            showLock={!config.unlocked && !hasFilterUnlockSubscription}
            onLockedFilterClick={onLockedFilterClick}
          />
        ))}
      </div>
    </div>
  );
};
