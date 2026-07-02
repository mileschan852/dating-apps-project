// packages/@dating/ui/src/components/PreferenceFilter.tsx
import React from 'react';
import { PreferenceFilterConfig } from '../types/preferenceFilters';
import { Lock } from 'lucide-react';

interface PreferenceFilterProps {
  config: PreferenceFilterConfig;
  currentValue: any;
  onChange: (value: any) => void;
  size?: 'xs' | 'sm' | 'md';
  showLock?: boolean;
  onLockedFilterClick?: () => void;
}

export const PreferenceFilter: React.FC<PreferenceFilterProps> = ({
  config,
  currentValue,
  onChange,
  size = 'sm',
  showLock = false,
  onLockedFilterClick,
}) => {
  const sizeClasses = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-sm px-3 py-1',
    md: 'text-base px-4 py-1.5',
  };

  const isLocked = !config.unlocked;

  const handleChange = (value: any) => {
    if (isLocked) {
      onLockedFilterClick?.();
      return;
    }
    onChange(value);
  };

  // === SLIDER (for Role - 0 to 1 spectrum) ===
  if (config.inputType === 'slider') {
    const sliderValue = typeof currentValue === 'number' ? currentValue : 0.5;
    // Side is only allowed when slider is exactly at 0.5 (middle)
    const isSideDisabled = sliderValue !== 0.5;

    return (
      <div className="flex flex-col gap-1 min-w-[160px]">
        <div className="flex items-center justify-between text-[#8E8E93] text-xs">
          <span>{config.label}</span>
          {showLock && isLocked && <Lock className="w-3 h-3" />}
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={sliderValue}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          disabled={isLocked}
          className="w-full accent-white"
        />

        <div className="flex justify-between text-[10px] text-[#8E8E93]">
          <span>0</span>
          <span>0.5</span>
          <span>1</span>
        </div>

        {/* Side Checkbox - disabled unless slider is at 0.5 */}
        {config.options?.some(o => o.value === 'side') && (
          <label className={`flex items-center gap-1.5 text-xs mt-1 ${isSideDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={currentValue === 'side'}
              onChange={() => handleChange('side')}
              disabled={isLocked || isSideDisabled}
            />
            Side
          </label>
        )}
      </div>
    );
  }

  // === TAG style (default for most preferences) ===
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[#8E8E93] text-xs">
        <span>{config.label}</span>
        {showLock && isLocked && <Lock className="w-3 h-3" />}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {/* Allow All / Group option (e.g. "Any", "Party") */}
        {config.allowAll && (
          <button
            onClick={() => handleChange('all')}
            disabled={isLocked}
            className={`${sizeClasses[size]} rounded-full border transition-all ${
              currentValue === 'all' 
                ? 'bg-white text-black border-white' 
                : 'bg-transparent text-white border-white/30 hover:border-white/60'
            }`}
          >
            {config.allowAll.label}
          </button>
        )}

        {/* Regular options */}
        {config.options?.map((option) => {
          const isActive = currentValue === option.value;
          const optionLocked = option.unlocked === false && !config.unlocked;

          return (
            <button
              key={option.value}
              onClick={() => handleChange(option.value)}
              disabled={isLocked || optionLocked}
              className={`${sizeClasses[size]} rounded-full border transition-all ${
                isActive 
                  ? 'bg-white text-black border-white' 
                : 'bg-transparent text-white border-white/30 hover:border-white/60'
              } ${optionLocked ? 'opacity-40' : ''}`}
              style={{
                backgroundColor: isActive ? (option.colour || config.colour) : undefined,
                borderColor: isActive ? (option.colour || config.colour) : undefined,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};