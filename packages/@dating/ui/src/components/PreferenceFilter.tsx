import React from 'react';

export const PreferenceFilter = ({ filterKey, config, value, onChange }: any) => {
  // This is a placeholder. Full implementation with tags, sliders, locked state, etc. will be added next.
  return (
    <button onClick={() => onChange(filterKey, 'next')} className="px-2 py-1 text-xs bg-[#2C2C2E] rounded">
      {config.label}: {value}
    </button>
  );
};
