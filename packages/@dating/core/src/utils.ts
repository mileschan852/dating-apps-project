import type { AppConfig, UserProfile } from './types';

/**
 * Converts raw DB row to clean UserProfile
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

/**
 * Admin check helper
 */
export function isAdminUser(user: any, adminIds: number[] = [], adminUsernames: string[] = []): boolean {
  if (!user) return false;
  if (adminIds.includes(user.id)) return true;
  if (user.username && adminUsernames.includes(user.username)) return true;
  return false;
}

/**
 * Migrate old user data to current structure
 */
export function migrateUserPreferences(rawUser: any, appConfig: AppConfig): UserProfile {
  const prefs: Record<string, string> = {};
  if (rawUser.preferences) Object.assign(prefs, rawUser.preferences);
  if (rawUser.safetyLevel && !prefs.safety) prefs.safety = rawUser.safetyLevel;
  if (appConfig?.preferences) {
    for (const cat of appConfig.preferences) {
      if (!prefs[cat.key]) prefs[cat.key] = cat.defaultValue || cat.options?.[0]?.value || '';
    }
  }
  return { ...rawUser, preferences: prefs, hasRealPhoto: rawUser.hasRealPhoto ?? rawUser.hasPhoto ?? false } as UserProfile;
}

/**
 * Build filtered + sorted list for the grid (matching first, then non-matching by distance)
 */
export function buildGridList<T extends {
  id: string; distance?: number; updatedAt?: string; hasRealPhoto?: boolean;
  isSide?: boolean; position?: number; preferences: Record<string, string>; [key: string]: any;
}>({
  ownProfile, allUsers, filters, appConfig, isRecentlyActive, maxUsers = 100
}: {
  ownProfile: T; allUsers: T[]; filters: Record<string, string | boolean>;
  appConfig: any; isRecentlyActive: (u: T) => boolean; maxUsers?: number;
}) {
  const sorted = [ownProfile, ...allUsers.filter(u => u.id !== ownProfile.id)]
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

  const matching: T[] = [];
  const nonMatching: T[] = [];

  for (const u of sorted) {
    let ok = true;
    if (filters.onlineOnly && !isRecentlyActive(u)) ok = false;
    if (filters.hasPic === true && !u.hasRealPhoto) ok = false;

    if (ok && filters.role && filters.role !== 'All') {
      const r = filters.role as string;
      if (r === 'Side') { if (!u.isSide) ok = false; }
      else {
        if (u.isSide) ok = false;
        const p = u.position ?? 0.5;
        if (r === 'Bottom' && p !== 0) ok = false;
        if (r === 'VB' && (p <= 0 || p > 0.5)) ok = false;
        if (r === 'V' && p !== 0.5) ok = false;
        if (r === 'VT' && (p <= 0.5 || p > 1)) ok = false;
        if (r === 'T' && p !== 1) ok = false;
      }
    }

    if (ok && appConfig?.preferences) {
      for (const cat of appConfig.preferences) {
        const sel = filters[cat.key];
        if (sel && sel !== 'All' && u.preferences?.[cat.key] !== sel) { ok = false; break; }
      }
    }
    if (ok) matching.push(u); else nonMatching.push(u);
  }

  let result = [...matching];
  if (result.length < maxUsers) result.push(...nonMatching.slice(0, maxUsers - result.length));

  return { gridUsers: result, matchingCount: matching.length, totalShown: result.length };
}
