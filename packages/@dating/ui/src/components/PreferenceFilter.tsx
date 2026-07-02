import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@dating/core';
import type { PreferenceFilterConfig, PreferenceOption } from '../../dating-core/types/preferenceFilters';

interface PreferenceFilterProps {
  config: PreferenceFilterConfig;
  value: any;
  onChange: (value: any) => void;
  showLock: boolean;
  onLockedFilterClick: () => void;
}

export const PreferenceFilter: React.FC<PreferenceFilterProps> = ({
  config,
  value,
  onChange,
  showLock,
  onLockedFilterClick,
}) => {
  const isSlider = config.inputType === 'slider';
  const isTag = config.inputType === 'tag';
  const isCheckbox = config.inputType === 'checkbox';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showLock) {
      onLockedFilterClick();
      return;
    }
    onChange(parseFloat(e.target.value));
  };

  const handleTagClick = (optValue: string) => {
    if (showLock && !config.unlocked) {
      onLockedFilterClick();
      return;
    }
    onChange(optValue);
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#1C1C1E] rounded-xl border border-[#2C2C2E]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#8E8E93]">{config.label}</span>
        {showLock && <Lock className="w-3.5 h-3.5 text-[#FFD60A]" />}
      </div>

      {isSlider && (
        <div className="flex flex-col gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={value}
            onChange={handleSliderChange}
            className={cn(
              "w-full h-1.5 bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer accent-[#FFD60A]",
              showLock && "opacity-50"
            )}
          />
          <div className="flex justify-between text-[10px] text-[#8E8E93]">
            {config.options.map((opt) => (
              <span key={opt.value}>{opt.label}</span>
            ))}
          </div>
        </div>
      )}

      {isTag && (
        <div className="flex flex-wrap gap-2">
          {config.allowAll && (
            <button
              onClick={() => handleTagClick('all')}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                value === 'all' 
                  ? "bg-[#FFD60A] text-black" 
                  : "bg-[#2C2C2E] text-[#8E8E93] hover:bg-[#3A3A3C]"
              )}
            >
              {config.allowAll.label}
            </button>
          )}
          {config.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTagClick(opt.value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                value === opt.value 
                  ? "bg-[#FFD60A] text-black" 
                  : "bg-[#2C2C2E] text-[#8E8E93] hover:bg-[#3A3A3C]",
                showLock && !config.unlocked && "opacity-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {isCheckbox && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => {
              if (showLock) {
                onLockedFilterClick();
                return;
              }
              onChange(e.target.checked);
            }}
            disabled={config.type === 'side' && typeof value === 'number' && value !== 0.5}
            className="w-4 h-4 rounded border-[#2C2C2E] bg-[#2C2C2E] text-[#FFD60A] focus:ring-0"
          />
          <span className={cn(
            "text-xs",
            config.type === 'side' && typeof value === 'number' && value !== 0.5 ? "text-[#48484A]" : "text-[#8E8E93]"
          )}>
            {config.label}
          </span>
        </div>
      )}
    </div>
  );
};
