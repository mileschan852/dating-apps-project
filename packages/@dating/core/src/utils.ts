import type { AppConfig, UserProfile } from './types';

// =====================================================
// USER STATUS UTILITIES
// =====================================================

/** Online window — matches the green dot threshold in the grid */
export const ONLINE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if a user was recently active (within last 15 minutes).
 * This is the source of truth for the green dot on grid tiles.
 */
export function isUserActive(user: any): boolean {
  if (!user?.updatedAt) return false;
  const lastActive = new Date(user.updatedAt).getTime();
  return (Date.now() - lastActive) < ONLINE_WINDOW_MS;
}

/**
 * Check if user is an admin
 */

// =====================================================
// DATA TRANSFORMATION
// =====================================================

/**
 * Convert raw database row into clean UserProfile object
 */
export function dbToProfile(raw: any): UserProfile {
  if (!raw) return {} as UserProfile;

  // ── Invisible status ──────────────────────────────────────────────
  // invisible_until = null/undefined → never invisible
  // invisible_until = specific timestamp → invisible until that time (auto-expires)
  // invisible_until = far-future sentinel (year 9999) → admin permanent invisible
  const invisibleUntilRaw = raw.invisible_until || raw.invisibleUntil || null;
  let isInvisible = false;
  let invisibleUntil: string | undefined = undefined;
  if (invisibleUntilRaw) {
    const until = new Date(invisibleUntilRaw).getTime();
    if (Date.now() < until) {
      isInvisible = true;
      invisibleUntil = invisibleUntilRaw;
    }
    // If timer has expired, isInvisible stays false — no DB write needed here
  }

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
    isInvisible,
    invisibleUntil,
    // chargesForMessages is read from Telegram initDataUnsafe in the app layer,
    // not stored in our DB (it's a Telegram account setting).
    chargesForMessages: raw.chargesForMessages ?? false,
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

// ─── Profile completeness helpers ────────────────────────────────────
export function isProfileComplete(profile: any): boolean {
  return !!(profile?.name && profile?.dob && profile?.gender && profile?.height && profile?.weight);
}

export function getMissingFields(profile: any): string[] {
  const missing: string[] = [];
  if (!profile?.name) missing.push('name');
  if (!profile?.dob) missing.push('dob');
  if (!profile?.gender) missing.push('gender');
  if (!profile?.height) missing.push('height');
  if (!profile?.weight) missing.push('weight');
  return missing;
}

// ─── Zodiac helpers ───────────────────────────────────────────────────
const ZODIAC_SIGNS = [
  { sign: 'Capricorn', emoji: '♑', from: [12, 22], to: [1, 19] },
  { sign: 'Aquarius', emoji: '♒', from: [1, 20], to: [2, 18] },
  { sign: 'Pisces', emoji: '♓', from: [2, 19], to: [3, 20] },
  { sign: 'Aries', emoji: '♈', from: [3, 21], to: [4, 19] },
  { sign: 'Taurus', emoji: '♉', from: [4, 20], to: [5, 20] },
  { sign: 'Gemini', emoji: '♊', from: [5, 21], to: [6, 20] },
  { sign: 'Cancer', emoji: '♋', from: [6, 21], to: [7, 22] },
  { sign: 'Leo', emoji: '♌', from: [7, 23], to: [8, 22] },
  { sign: 'Virgo', emoji: '♍', from: [8, 23], to: [9, 22] },
  { sign: 'Libra', emoji: '♎', from: [9, 23], to: [10, 22] },
  { sign: 'Scorpio', emoji: '♏', from: [10, 23], to: [11, 21] },
  { sign: 'Sagittarius', emoji: '♐', from: [11, 22], to: [12, 21] },
];

export function getZodiac(dob: string | null | undefined): string {
  if (!dob) return '';
  const d = new Date(dob);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  for (const z of ZODIAC_SIGNS) {
    const [fm, fd] = z.from;
    const [tm, td] = z.to;
    if (fm === 12) {
      if ((m === 12 && day >= fd) || (m === 1 && day <= td)) return z.sign;
    } else {
      if ((m === fm && day >= fd) || (m === tm && day <= td)) return z.sign;
    }
  }
  return '';
}

export function getZodiacEmoji(dob: string | null | undefined): string {
  const sign = getZodiac(dob);
  return ZODIAC_SIGNS.find((z) => z.sign === sign)?.emoji || '';
}

export function getAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function formatDist(km: number | null | undefined): string {
  if (km == null || km <= 0) return '';
  if (km < 1) return '<1 km';
  return `${Math.round(km)} km`;
}
