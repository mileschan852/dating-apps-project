import type { AppConfig, UserProfile } from './types';

// =====================================================
// USER STATUS UTILITIES
// =====================================================

/**
 * Check if a user was recently active (within last 30 minutes)
 */
export function isUserActive(user: any): boolean {
  if (!user?.updatedAt) return false;
  const lastActive = new Date(user.updatedAt).getTime();
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  return (now - lastActive) < thirtyMinutes;
}

/**
 * Check if user is an admin
 */
export function isAdminUser(
  user: any, 
  adminIds: number[] = [], 
  adminUsernames: string[] = []
): boolean {
  if (!user) return false;
  if (adminIds.includes(user.id)) return true;
  if (user.username && adminUsernames.includes(user.username)) return true;
  return false;
}

// =====================================================
// DATA TRANSFORMATION
// =====================================================

/**
 * Convert raw database row into clean UserProfile object
 */
export function dbToProfile(raw: any): UserProfile {
  if (!raw) return {} as UserProfile;

  return {
    id: raw.id,
    name: raw.name || raw.tg_first_name || '',
    tgId: raw.tg_id || raw.tgId,
    tgUsername: raw.tg_username || raw.tgUsername,
    tgPhotoUrl: raw.tg_photo_url || raw.tgPhotoUrl,
    hasRealPhoto: raw.has_real_photo ?? raw.hasRealPhoto ?? false,
    dob: raw.dob,
    age: raw.age,
    height: raw.height,
    weight: raw.weight,
    gender: raw.gender,
    seekingGender: raw.seeking_gender || raw.seekingGender,
    position: raw.position,
    isSide: raw.is_side ?? raw.isSide ?? false,
    preferences: raw.preferences || {},
    openToMessages: raw.open_to_messages ?? raw.openToMessages ?? true,
    updatedAt: raw.updated_at || raw.updatedAt,
    distance: raw.distance || 0,
    hideAge: raw.hide_age ?? raw.hideAge ?? false,
  } as UserProfile;
}

// =====================================================
// PREFERENCE & DATA MIGRATION
// =====================================================

/**
 * Migrate old user data structure to current format
 */
export function migrateUserPreferences(rawUser: any, appConfig: AppConfig): UserProfile {
  const prefs: Record<string, string> = {};

  if (rawUser.preferences) {
    Object.assign(prefs, rawUser.preferences);
  }

  if (rawUser.safetyLevel && !prefs.safety) {
    prefs.safety = rawUser.safetyLevel;
  }

  if (appConfig?.preferences) {
    for (const cat of appConfig.preferences) {
      if (!prefs[cat.key]) {
        prefs[cat.key] = cat.defaultValue || cat.options?.[0]?.value || '';
      }
    }
  }

  return {
    ...rawUser,
    preferences: prefs,
    hasRealPhoto: rawUser.hasRealPhoto ?? rawUser.hasPhoto ?? false,
  } as UserProfile;
}

// =====================================================
// GRID FILTERING & SORTING
// =====================================================

export interface BuildGridListResult<T> {
  matching: T[];
  nonMatching: T[];
  matchingCount: number;
}

export function buildGridList<T extends {
  id: string;
  distance?: number;
  updatedAt?: string;
  hasRealPhoto?: boolean;
  isSide?: boolean;
  position?: number;
  preferences: Record<string, string>;
  [key: string]: any;
}>({
  ownProfile,
  allUsers,
  filters,
  appConfig,
  isRecentlyActive,
  maxUsers = 100,
}: {
  ownProfile: T;
  allUsers: T[];
  filters: Record<string, string | boolean>;
  appConfig: AppConfig;
  isRecentlyActive: (user: T) => boolean;
  maxUsers?: number;
}): BuildGridListResult<T> {

  // Sort by distance (closest first)
  const sortedUsers = [ownProfile, ...allUsers.filter(u => u.id !== ownProfile.id)]
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

  const matching: T[] = [];
  const nonMatching: T[] = [];

  for (const user of sortedUsers) {
    let matches = true;

    // Online filter
    if (filters.onlineOnly && !isRecentlyActive(user)) {
      matches = false;
    }

    // Has photo filter
    if (matches && filters.hasPic === true && !user.hasRealPhoto) {
      matches = false;
    }

    // Role filter
    if (matches && filters.role && filters.role !== 'All') {
      matches = matchesRoleFilter(user, filters.role as string);
    }

    // Preference filters
    if (matches && appConfig?.preferences) {
      matches = matchesPreferenceFilters(user, filters, appConfig);
    }

    if (matches) {
      matching.push(user);
    } else {
      nonMatching.push(user);
    }
  }

  return {
    matching,
    nonMatching,
    matchingCount: matching.length,
  };
}

// --- Private helper functions ---

function matchesRoleFilter(user: any, roleFilter: string): boolean {
  if (!roleFilter || roleFilter === 'All') return true;

  const p = user.position ?? 0.5;
  const isSide = user.isSide ?? false;

  if (roleFilter === 'Side') return isSide;
  if (isSide) return false;

  switch (roleFilter) {
    case 'Bottom': return p === 0;
    case 'VB':     return p > 0 && p <= 0.5;
    case 'V':      return p === 0.5;
    case 'VT':     return p > 0.5 && p < 1;
    case 'T':      return p === 1;
    default:       return true;
  }
}

function matchesPreferenceFilters(
  user: any,
  filters: Record<string, string | boolean>,
  appConfig: AppConfig
): boolean {
  for (const cat of appConfig.preferences || []) {
    const selected = filters[cat.key];
    if (selected && selected !== 'All' && user.preferences?.[cat.key] !== selected) {
      return false;
    }
  }
  return true;
}
