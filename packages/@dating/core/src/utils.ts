import type { AppConfig, UserProfile } from './types';

// ==================== EXISTING + NEW UTILITIES ====================

/**
 * Converts raw database row to UserProfile
 */
export function dbToProfile(raw: any, lat?: number, lng?: number): UserProfile {
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

/**
 * Checks if user is admin
 */
export function isAdminUser(user: any, adminIds: number[] = [], adminUsernames: string[] = []): boolean {
  if (!user) return false;
  if (adminIds.includes(user.id)) return true;
  if (user.username && adminUsernames.includes(user.username)) return true;
  return false;
}

/**
 * Migrates old user data to current structure
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

/**
 * Builds filtered + sorted user list for grid
 */
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
  appConfig: any;
  isRecentlyActive: (u: T) => boolean;
  maxUsers?: number;
}) {
  const allByDistance = [ownProfile, ...allUsers.filter(u => u.id !== ownProfile.id)]
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

  const matching: T[] = [];
  const nonMatching: T[] = [];

  for (const u of allByDistance) {
    let matches = true;

    if (filters.onlineOnly && !isRecentlyActive(u)) matches = false;

    if (filters.hasPic === true && !u.hasRealPhoto) matches = false;

    if (matches && filters.role && filters.role !== 'All') {
      const roleFilter = filters.role as string;
      if (roleFilter === 'Side') {
        if (!u.isSide) matches = false;
      } else {
        if (u.isSide) matches = false;
        const p = u.position ?? 0.5;
        if (roleFilter === 'Bottom' && p !== 0) matches = false;
        if (roleFilter === 'VB' && (p <= 0 || p > 0.5)) matches = false;
        if (roleFilter === 'V' && p !== 0.5) matches = false;
        if (roleFilter === 'VT' && (p <= 0.5 || p > 1)) matches = false;
        if (roleFilter === 'T' && p !== 1) matches = false;
      }
    }

    if (matches && appConfig?.preferences) {
      for (const cat of appConfig.preferences) {
        const selected = filters[cat.key];
        if (selected && selected !== 'All' && u.preferences?.[cat.key] !== selected) {
          matches = false;
          break;
        }
      }
    }

    if (matches) matching.push(u);
    else nonMatching.push(u);
  }

  let finalList = [...matching];
  if (finalList.length < maxUsers) {
    const needed = maxUsers - finalList.length;
    finalList = [...finalList, ...nonMatching.slice(0, needed)];
  }

  return {
    gridUsers: finalList,
    matchingCount: matching.length,
    totalShown: finalList.length,
  };
}
