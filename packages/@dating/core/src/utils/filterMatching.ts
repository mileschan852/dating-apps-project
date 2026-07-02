import { PreferenceFilterConfig } from '../types/preferenceFilters';

interface FilterState {
  onlineOnly: boolean;
  hasPicOnly: boolean;
  preferences: Record<string, string | number | boolean>;
}

interface User {
  id: number;
  is_online?: boolean;
  has_real_photo?: boolean;
  role?: number;
  is_side?: boolean;
  preference1?: string;
  preference2?: string;
  preference3?: string;
  preference4?: string;
}

/**
 * Checks if a user matches the current filter state.
 * This is the core matching logic for HKMOD.
 */
export function doesUserMatchFilters(
  user: User,
  filters: FilterState,
  config: Record<string, PreferenceFilterConfig>
): boolean {
  // 1. Online filter
  if (filters.onlineOnly && !user.is_online) {
    return false;
  }

  // 2. Has Pic filter
  if (filters.hasPicOnly && !user.has_real_photo) {
    return false;
  }

  // 3. Preference filters
  for (const [key, filterConfig] of Object.entries(config)) {
    const currentFilterValue = filters.preferences[key];
    if (!currentFilterValue) continue;

    const userValue = getUserPreferenceValue(user, key);

    if (!matchesPreference(currentFilterValue, userValue, filterConfig)) {
      return false;
    }
  }

  return true;
}

function getUserPreferenceValue(user: User, key: string): string | number | undefined {
  if (key === 'role') return user.role;
  if (key === 'safety') return user.preference1;
  if (key === 'drug') return user.preference2;
  if (key === 'meetup') return user.preference3;
  if (key === 'where') return user.preference4;

  return undefined;
}

function matchesPreference(
  filterValue: string | number | boolean,
  userValue: string | number | undefined,
  config: PreferenceFilterConfig
): boolean {
  if (!userValue) return true;

  if (config.type === 'role') {
    return matchesRoleFilter(filterValue, userValue);
  }

  const fVal = String(filterValue).toLowerCase();
  const uVal = String(userValue).toLowerCase();

  if (config.allowAll) {
    const allLabel = config.allowAll.label.toLowerCase();
    if (fVal === 'all' || fVal === allLabel) {
      return true;
    }
  }

  if (config.groupBehavior === 'party_group') {
    if (fVal === 'party' || fVal === 'all') {
      return uVal === 'party' || uVal === 'party_check';
    }
    if (fVal === 'party_check') {
      return uVal === 'party_check';
    }
    if (fVal === 'clean') {
      return uVal === 'clean';
    }
  }

  if (config.groupBehavior === 'meetup_asymmetric') {
    if (fVal === '1on1') {
      return uVal === '1on1' || uVal === 'group';
    }
    if (fVal === 'group') {
      return uVal === 'group';
    }
  }

  return fVal === uVal;
}

/**
 * Realistic Role matching logic
 */
function matchesRoleFilter(
  filterValue: string | number | boolean,
  userValue: string | number | undefined
): boolean {
  if (userValue === undefined || userValue === null) return true;

  const f = filterValue;
  const u = userValue;

  if (f === 'side') {
    return u === 'side';
  }

  if (u === 'side') {
    if (typeof f === 'number') {
      return Math.abs(f - 0.5) <= 0.15;
    }
    return false;
  }

  if (typeof f === 'number' && typeof u === 'number') {
    if (f <= 0.4) {
      return u >= 0.5;
    }
    if (f >= 0.6) {
      return u <= 0.5;
    }
    return Math.abs(u - f) <= 0.45;
  }

  return String(f).toLowerCase() === String(u).toLowerCase();
}
