// packages/@dating/ui/src/components/FilterBar.tsx
import React from 'react';
import { PreferenceFilter } from './PreferenceFilter';
import { PreferenceFiltersConfig } from '../types/preferenceFilters';

interface FilterBarProps {
  // === Fixed filters (not configurable by apps) ===
  onlineOnly: boolean;
  onToggleOnline: () => void;

  hasPicOnly: boolean;
  onToggleHasPic: () => void;

  // === Config-driven preference filters ===
  preferenceFilters: PreferenceFiltersConfig;
  preferences: Record<string, any>;
  onSetPreference: (key: string, value: any) => void;

  // === Lock behavior ===
  hasFilterUnlockSubscription?: boolean;

  dividingIndex?: number; // Filters after this index will be smaller
}

export const FilterBar: React.FC<FilterBarProps> = ({
  onlineOnly,
  onToggleOnline,
  hasPicOnly,
  onToggleHasPic,
  preferenceFilters,
  preferences,
  onSetPreference,
  hasFilterUnlockSubscription = false,
  dividingIndex = 2,
}) => {
  const filterEntries = Object.entries(preferenceFilters);

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[#2C2C2E] bg-[#0A0A0A]">
      {/* === Fixed Filter 1: Online / Offline === */}
      <button
        onClick={onToggleOnline}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition ${
          onlineOnly ? 'bg-green-500 text-black' : 'bg-[#2C2C2E] text-white'
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${onlineOnly ? 'bg-black' : 'bg-gray-400'}`} />
        {onlineOnly ? 'Online' : 'Offline'}
      </button>

      {/* === Fixed Filter 2: Has Pic / No Pic === */}
      <button
        onClick={onToggleHasPic}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition ${
          hasPicOnly ? 'bg-[#5AC8FA] text-black' : 'bg-[#2C2C2E] text-white'
        }`}
      >
        {hasPicOnly ? '📷 Has pic' : 'No pic'}
      </button>

      {/* === Preference Filters from config === */}
      <div className="flex flex-wrap gap-1.5 ml-2 pl-2 border-l border-[#3A3A3C]">
        {filterEntries.map(([key, config], index) => {
          const isSmall = index >= dividingIndex;
          const isLocked = !config.unlocked && !hasFilterUnlockSubscription;

          return (
            <PreferenceFilter
              key={key}
              config={config}
              currentValue={preferences[key]}
              onChange={(value) => onSetPreference(key, value)}
              size={isSmall ? 'xs' : 'sm'}
              showLock={isLocked}
              onLockedFilterClick={() => {
                console.log(`Locked filter clicked: ${key}`);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};