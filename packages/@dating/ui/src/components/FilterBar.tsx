import React from 'react';
import { OnlineFilter, PicFilter } from './FilterButton';

export const FilterBar = ({ onlineOnly, onToggleOnline, hasPicOnly, onToggleHasPic, preferenceFilters, preferences, onSetPreference, dividingIndex = 2 }: any) => {
  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-[#2C2C2E]">
      <OnlineFilter isActive={onlineOnly} onClick={onToggleOnline} />
      <PicFilter isActive={hasPicOnly} onClick={onToggleHasPic} />
      {/* Preference filters from config go here, smaller size after dividingIndex */}
    </div>
  );
};
