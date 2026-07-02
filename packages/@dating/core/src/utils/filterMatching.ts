import type { PreferenceFiltersConfig } from '../types/preferenceFilters';

export function doesUserMatchFilters(
  user: any,
  filters: { onlineOnly: boolean; hasPicOnly: boolean; preferences: Record<string, any> },
  config: PreferenceFiltersConfig
): boolean {
  const { onlineOnly, hasPicOnly, preferences } = filters;

  if (onlineOnly && !user.is_online) return false;
  if (hasPicOnly && !user.has_real_photo) return false;

  for (const [key, filterConfig] of Object.entries(config)) {
    const filterValue = preferences[key];
    const userValue = user[key] ?? user.preferences?.[key];

    if (!matchesPreference(filterValue, userValue, filterConfig)) {
      return false;
    }
  }
  return true;
}

function matchesPreference(filterValue: any, userValue: any, config: any): boolean {
  if (filterValue === 'all' || filterValue === undefined) return true;
  if (userValue === undefined || userValue === null) return false;

  if (config.type === 'role') {
    return matchesRoleFilter(filterValue, userValue);
  }

  if (config.groupBehavior === 'party_group') {
    if (filterValue === 'party') {
      return userValue === 'party' || userValue === 'party_check';
    }
    return filterValue === userValue;
  }

  if (config.groupBehavior === 'meetup_asymmetric') {
    if (filterValue === '1on1') {
      return userValue === '1on1' || userValue === 'group';
    }
    return filterValue === userValue;
  }

  if (config.allowAll && filterValue === 'all') return true;

  return filterValue === userValue;
}

function matchesRoleFilter(filterValue: any, userValue: any): boolean {
  if (filterValue === 'side') {
    return userValue === 'side';
  }
  if (typeof filterValue !== 'number') return true;

  const f = filterValue;
  const u = typeof userValue === 'number' ? userValue : 0.5;

  if (f <= 0.4) return u >= 0.5;
  if (f >= 0.6) return u <= 0.5;
  return Math.abs(f - u) <= 0.45;
}
