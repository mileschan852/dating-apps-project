import React from 'react';
import TemplateApp from './app-base/App';

import type { UserProfile } from './dating-core/types';
import { ToggleButton } from './dating-ui/FilterButton';

// ─── HKMO-specific preference categories ─────────────────────────────
// These are the ONLY things that differ from the template.
// All grid logic, filters, flying messages, profile edit, etc. live in TemplateApp.

const HKMO_ADMIN_USERNAMES = ['MilesChan852', 'HKMembersOnly'];

// ─── HKMO preference filter logic ────────────────────────────────────
function hkmoPrefFilterFn(
  user: UserProfile,
  prefFilters: Record<string, string>
): boolean {
  const roleFilter = prefFilters['role'];
  if (roleFilter && roleFilter !== 'All') {
    const userRole = user.preferences?.['role'] || '';
    if (userRole !== roleFilter) return false;
  }
  const safetyFilter = prefFilters['safety'];
  if (safetyFilter && safetyFilter !== 'All') {
    const userSafety = user.preferences?.['safety'] || '';
    if (userSafety !== safetyFilter) return false;
  }
  return true;
}

// ─── HKMO preference filter buttons ──────────────────────────────────
// Rendered inside FilterRow's children slot, after Online + Has Pic.
interface HKMOFiltersProps {
  prefFilters: Record<string, string>;
  setPrefFilter: (key: string, value: string) => void;
}

function HKMOFilters({ prefFilters, setPrefFilter }: HKMOFiltersProps) {
  const roleOptions = ['All', 'Top', 'Bottom', 'Versatile', 'Side'] as const;
  const safetyOptions = ['All', 'Safe', 'Ask me'] as const;

  return (
    <>
      {/* Divider between base filters and preference filters */}
      <div className="w-px h-4 bg-[#2C2C2E] mx-0.5 flex-shrink-0" />

      {/* Role filter */}
      {roleOptions.map((opt) => (
        <ToggleButton
          key={`role-${opt}`}
          active={prefFilters['role'] === opt}
          onClick={() => setPrefFilter('role', opt)}
        >
          {opt === 'All' ? '🎭 Role' : opt}
        </ToggleButton>
      ))}

      {/* Divider between role and safety */}
      <div className="w-px h-4 bg-[#2C2C2E] mx-0.5 flex-shrink-0" />

      {/* Safety filter */}
      {safetyOptions.map((opt) => (
        <ToggleButton
          key={`safety-${opt}`}
          active={prefFilters['safety'] === opt}
          onClick={() => setPrefFilter('safety', opt)}
        >
          {opt === 'All' ? '🛡 Safety' : opt}
        </ToggleButton>
      ))}
    </>
  );
}

// ─── HKMO App ─────────────────────────────────────────────────────────
// This component is intentionally thin — it only provides HKMO-specific
// preference filters. Everything else (grid, flying messages, profile edit,
// location gate, heartbeat, DB, etc.) is handled by TemplateApp.

export default function HKMOApp() {
  const [prefFilters, setPrefFilters] = React.useState<Record<string, string>>({
    role: 'All',
    safety: 'All',
  });

  const setPrefFilter = React.useCallback((key: string, value: string) => {
    setPrefFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const extraFilters = (
    <HKMOFilters prefFilters={prefFilters} setPrefFilter={setPrefFilter} />
  );

  return (
    <TemplateApp
      appName="HKMOD"
      appVersion="1H"
      adminUsernames={HKMO_ADMIN_USERNAMES}
      defaultPrefFilters={{ role: 'All', safety: 'All' }}
      prefFilterFn={hkmoPrefFilterFn}
      extraFilters={extraFilters}
      groupChatUrl="https://t.me/HKMembersOnly"
      referShareUrl="https://t.me/HKMembersOnlyBot?start=ref"
      officialChatLabel="@HKMembersOnlyChat"
    />
  );
}
