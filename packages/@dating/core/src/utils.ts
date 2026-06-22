// Shared utility functions for ALL dating apps
import type { UserProfile, DbUser, Lang, PreferenceCategory } from './types'

// ─── Admin ────────────────────────────────────────────────────────────

export function isAdminUser(
  user: { id?: number; username?: string } | null | undefined,
  adminIds: number[],
  adminUsernames: string[],
): boolean {
  if (!user) return false
  if (user.id && adminIds.includes(user.id)) return true
  if (user.username && adminUsernames.includes(user.username)) return true
  return false
}

// ─── Time / Distance ──────────────────────────────────────────────────

export function getTimeAgo(updatedAt?: string): string {
  if (!updatedAt) return ''
  const diff = Date.now() - new Date(updatedAt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDist(d: number): string {
  if (d < 1) return `${Math.round(d * 1000)}m`
  return `${d.toFixed(1)}km`
}

export function isUserActive(user: { updatedAt?: string }): boolean {
  if (!user.updatedAt) return false
  return Date.now() - new Date(user.updatedAt).getTime() < 15 * 60 * 1000
}

// ─── Zodiac ───────────────────────────────────────────────────────────

export function getZodiac(dob?: string): string {
  if (!dob) return ''
  const d = new Date(dob)
  const m = d.getMonth() + 1
  const day = d.getDate()
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Aquarius'
  if ((m === 2 && day >= 19) || (m === 3 && day <= 20)) return 'Pisces'
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Aries'
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Taurus'
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Gemini'
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Cancer'
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Leo'
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Virgo'
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Libra'
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Scorpio'
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Sagittarius'
  return 'Capricorn'
}

export function getZodiacEmoji(sign: string): string {
  const map: Record<string, string> = {
    Aquarius: '\u2652', Aries: '\u2648', Taurus: '\u2649',
    Gemini: '\u264A', Cancer: '\u264B', Leo: '\u264C',
    Virgo: '\u264D', Libra: '\u264E', Scorpio: '\u264F',
    Sagittarius: '\u2650', Capricorn: '\u2651', Pisces: '\u2653',
  }
  return map[sign] || '\u2B50'
}

export function getAge(dob?: string): number {
  if (!dob) return 0
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

// ─── Profile Completion ───────────────────────────────────────────────

export function isProfileComplete(p: UserProfile): boolean {
  return !!(
    p.name &&
    p.name !== 'You' &&
    p.dob &&
    p.gender &&
    p.height > 0 &&
    p.weight > 0 &&
    p.hasPhoto
  )
}

export function getMissingFields(p: UserProfile): string[] {
  const missing: string[] = []
  if (!p.name || p.name === 'You') missing.push('name')
  if (!p.dob) missing.push('dob')
  if (!p.gender) missing.push('gender')
  if (!p.height || p.height <= 0) missing.push('height')
  if (!p.weight || p.weight <= 0) missing.push('weight')
  if (!p.hasPhoto) missing.push('photo')
  return missing
}

// ─── DB → Profile ─────────────────────────────────────────────────────

export function dbToProfile(u: DbUser, myLat: number, myLng: number): UserProfile {
  const dist = u.lat && u.lng ? getDistance(myLat, myLng, u.lat, u.lng) : 0
  const dob = u.dob || undefined

  // Build preferences map from preference1-preference4
  const preferences: Record<string, string> = {}
  if (u.preference1) preferences.pref1 = u.preference1
  if (u.preference2) preferences.pref2 = u.preference2
  if (u.preference3) preferences.pref3 = u.preference3
  if (u.preference4) preferences.pref4 = u.preference4

  return {
    // Identity
    id: String(u.id),
    name: u.name,

    // Birth
    dob,
    age: getAge(dob),
    zodiac: getZodiac(dob),

    // Physical
    gender: (u.gender as 'Male' | 'Female' | 'Non-binary') || 'Male',
    height: u.height || 0,
    weight: u.weight || 0,
    position: u.position ?? 0.5,

    // Visibility
    showAge: u.show_age ?? true,
    showDob: u.show_dob ?? false,
    showZodiac: u.show_zodiac ?? true,
    showGender: u.show_gender ?? true,
    showHeight: u.show_height ?? true,
    showWeight: u.show_weight ?? true,
    showPosition: u.show_position ?? true,
    showDistance: u.show_distance ?? true,

    // Seeking
    seekingGender: (u.seeking_gender as 'Men' | 'Women' | 'Everyone') || 'Everyone',
    seekingAgeMin: u.seeking_age_min ?? 18,
    seekingAgeMax: u.seeking_age_max ?? 99,

    // Preferences
    preferences,

    // Telegram
    tgUsername: u.tg_username || undefined,
    tgPhotoUrl: u.photo_url?.startsWith('http') ? u.photo_url : undefined,
    tgPhotos: u.photo_url?.startsWith('http') ? [u.photo_url] : [],
    hasPhoto: !!(u.photo_url && u.photo_url.startsWith('http')),
    hasRealPhoto: u.has_real_photo ?? undefined,

    // Status
    isOnline: u.is_online ?? false,
    distance: Math.round(dist),
    lat: u.lat ?? undefined,
    lng: u.lng ?? undefined,
    openToMessages: u.open_to_messages ?? false,
    updatedAt: u.updated_at,

    // Feature unlocks
    isInvisible: !!u.invisible_until && new Date(u.invisible_until).getTime() > Date.now(),
    invisibleUntil: u.invisible_until ?? undefined,
    hideAge: !!u.hide_age,
    hideAgeUntil: u.hide_age_until ?? undefined,
    filtersUnlocked: u.filters_unlocked ?? false,
    filtersUnlockedUntil: u.filters_unlocked_expires_at ?? undefined,
    profileUnlocked: false,
  }
}

// ─── Profile → DB ─────────────────────────────────────────────────────

export function profileToDb(p: UserProfile): Partial<DbUser> {
  return {
    name: p.name,
    dob: p.dob || null,
    gender: p.gender,
    height: p.height,
    weight: p.weight,
    position: p.position ?? null,
    photo_url: p.tgPhotoUrl || null,
    tg_username: p.tgUsername || null,
    open_to_messages: p.openToMessages,
    is_online: true,
    updated_at: new Date().toISOString(),

    show_age: p.showAge,
    show_dob: p.showDob,
    show_zodiac: p.showZodiac,
    show_gender: p.showGender,
    show_height: p.showHeight,
    show_weight: p.showWeight,
    show_position: p.showPosition,
    show_distance: p.showDistance,

    seeking_gender: p.seekingGender,
    seeking_age_min: p.seekingAgeMin,
    seeking_age_max: p.seekingAgeMax,

    preference1: p.preferences.pref1 || null,
    preference2: p.preferences.pref2 || null,
    preference3: p.preferences.pref3 || null,
    preference4: p.preferences.pref4 || null,
  }
}

// ─── Preference Helpers ───────────────────────────────────────────────

export function getPreferenceLabel(
  categories: PreferenceCategory[],
  key: string,
  lang: Lang
): string {
  const cat = categories.find(c => c.key === key)
  return cat?.label[lang] || cat?.label['en'] || key
}

export function getPreferenceOptionLabel(
  categories: PreferenceCategory[],
  key: string,
  value: string,
  lang: Lang
): string {
  const cat = categories.find(c => c.key === key)
  const opt = cat?.options.find(o => o.value === value)
  return opt?.label[lang] || opt?.label['en'] || value
}

export function getPreferenceColour(
  categories: PreferenceCategory[],
  key: string,
  value: string
): string {
  const cat = categories.find(c => c.key === key)
  const opt = cat?.options.find(o => o.value === value)
  return opt?.colour || ''
}

// ─── Photo Detection ──────────────────────────────────────────────────

export async function detectRealPhoto(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false
  const lower = imageUrl.toLowerCase()
  if (lower.endsWith('.svg')) return false
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return true
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 3000)
    const res = await fetch(imageUrl, { method: 'HEAD', signal: ctrl.signal })
    clearTimeout(timer)
    const ct = res.headers.get('Content-Type') || ''
    return ct.includes('image/jpeg') || ct.includes('image/png') || ct.includes('image/webp') || ct.includes('image/gif')
  } catch {
    return true
  }
}
