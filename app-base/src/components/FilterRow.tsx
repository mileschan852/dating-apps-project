import React from 'react';
import { FilterButton } from '@dating/ui';
import { Circle, Camera } from 'lucide-react';

export interface FilterRowProps {
  onlineOnly: boolean;
  hasPicOnly: boolean;
  onToggleOnline: () => void;
  onToggleHasPic: () => void;
  /** Slot for app-specific preference filter buttons (e.g. HKMO role/safety) */
  children?: React.ReactNode;
}

export function FilterRow({
  onlineOnly,
  hasPicOnly,
  onToggleOnline,
  onToggleHasPic,
  children,
}: FilterRowProps) {
  return (
    <div className="px-3 py-1.5 flex items-center gap-1.5 flex-wrap overflow-x-auto scrollbar-hide">
      <FilterButton
        label="Online"
        isActive={onlineOnly}
        onClick={onToggleOnline}
        activeIcon={<Circle className="w-3 h-3 fill-green-500 text-green-500" />}
        inactiveIcon={<Circle className="w-3 h-3 fill-gray-500 text-gray-500" />}
        size="sm"
      />
      <FilterButton
        label="Has Pic"
        isActive={hasPicOnly}
        onClick={onToggleHasPic}
        activeIcon={<Camera className="w-3.5 h-3.5" />}
        inactiveIcon={<Camera className="w-3.5 h-3.5 opacity-60" />}
        size="sm"
      />
      {children}
    </div>
  );
}
