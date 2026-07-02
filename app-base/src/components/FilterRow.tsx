import React from 'react';
import { ToggleButton } from '@dating/ui';

export interface FilterRowProps {
  onlineOnly: boolean;
  hasPicOnly: boolean;
  onToggleOnline: () => void;
  onToggleHasPic: () => void;
  /** Slot for app-specific preference filter buttons (e.g. HKMO role/safety) */
  children?: React.ReactNode;
}

/**
 * Template filter row — always shows Online and Has Pic toggles.
 * Apps can inject additional preference filters via `children`.
 */
export function FilterRow({
  onlineOnly,
  hasPicOnly,
  onToggleOnline,
  onToggleHasPic,
  children,
}: FilterRowProps) {
  return (
    <div className="px-3 py-1.5 flex items-center gap-1.5 flex-wrap overflow-x-auto scrollbar-hide">
      <ToggleButton
        active={onlineOnly}
        onClick={onToggleOnline}
        title="Show online users only"
      >
        🟢 Online
      </ToggleButton>
      <ToggleButton
        active={hasPicOnly}
        onClick={onToggleHasPic}
        title="Show users with verified photo only"
      >
        📷 Has Pic
      </ToggleButton>
      {children}
    </div>
  );
}
