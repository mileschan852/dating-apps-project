import type { UserProfile } from '../types';

export function matchesRoleFilter(userValue: number, filterValue: number): boolean {
  // Filter <= 0.4 -> matches users >= 0.5
  if (filterValue <= 0.4) return userValue >= 0.5;
  // Filter >= 0.6 -> matches users <= 0.5
  if (filterValue >= 0.6) return userValue <= 0.5;
  // Around 0.5 -> broader matching (+/- 0.45)
  return Math.abs(userValue - filterValue) <= 0.45;
}

export function doesUserMatchFilters(
  user: UserProfile,
  filters: Record<string, any>,
  groupBehaviors?: Record<string, string>
): boolean {
  for (const [key, filterValue] of Object.entries(filters)) {
    if (filterValue === 'all') continue;

    const userValue = user.preferences?.[key];
    const behavior = groupBehaviors?.[key];

    if (key === 'role' && typeof filterValue === 'number') {
      if (!matchesRoleFilter(Number(userValue || 0.5), filterValue)) return false;
      continue;
    }

    if (behavior === 'party_group') {
      // Party covers Party + Party✓ only
      if (filterValue === 'party') {
        if (userValue !== 'party' && userValue !== 'party_check') return false;
        continue;
      }
    }

    if (behavior === 'meetup_asymmetric') {
      // Group must match 1on1, but not vice versa
      if (filterValue === 'group' && userValue !== '1on1') return false;
      continue;
    }

    if (userValue !== filterValue) return false;
  }
  return true;
}
