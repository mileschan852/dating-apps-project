// ═══════════════════════════════════════════════════════════════════════
// Unified types for ALL dating apps
// Every app uses the same profile structure. Apps customize via
// PreferenceConfig (which preference categories they have).
// ═══════════════════════════════════════════════════════════════════════

export type Lang = 'en' | 'tc' | 'sc' | 'ru'

// ─── Unified User Profile ─────────────────────────────────────────────

export interface UserProfile {
  // ── Identity ──
  id: string
  name: string

  // ── Birth & Age ──
  dob?: string           // YYYY-MM-DD
  age?: number           // auto-calculated from DOB
  zodiac?: string        // auto-calculated from DOB

  // ── Physical ──
  gender: 'Male' | 'Female' | 'Non-binary'
  height: number         // cm
  weight: number         // kg
  position?: number      // 0=Bottom → 1=Top (HKMOD uses this as role)

  // ── Visibility toggles ──
  // User controls which fields others can see
  showAge: boolean
  showDob: boolean
  showZodiac: boolean
  showGender: boolean
  showHeight: boolean
  showWeight: boolean
  showPosition: boolean
  showDistance: boolean

  // ── Seeking ──
  seekingGender: 'Men' | 'Women' | 'Everyone'
  seekingAgeMin: number
  seekingAgeMax: number

  // ── App-defined preferences (filters on grid) ──
  // Key = preference category key, Value = selected option
  // Each app defines its own preference categories via PreferenceConfig
  preferences: Record<string, string>

  // ── Telegram ──
  tgUsername?: string
  tgPhotoUrl?: string
  tgPhotos?: string[]
  hasPhoto: boolean
  hasRealPhoto?: boolean

  // ── Status ──
  isOnline: boolean
  distance: number
  lat?: number
  lng?: number
  isOwn?: boolean
  openToMessages: boolean
  updatedAt?: string

  // ── Feature unlocks (managed by hooks) ──
  isInvisible: boolean
  invisibleUntil?: string
  hideAge: boolean
  hideAgeUntil?: string
  filtersUnlocked: boolean
  filtersUnlockedUntil?: string
  profileUnlocked: boolean
}

// ─── Preference Category ──────────────────────────────────────────────
// Each app defines its own set of preference categories.
// These appear as filter buttons on the grid.

export interface PreferenceOption {
  value: string
  label: Record<Lang, string>
  colour: string          // Tailwind colour class, e.g. "bg-blue-500/20 text-blue-400"
}

export interface PreferenceCategory {
  key: string             // e.g. "safety", "activity", "role"
  label: Record<Lang, string>
  options: PreferenceOption[]
  defaultValue: string
  locked?: boolean        // if true, user cannot change this preference
}

// ─── App Config ───────────────────────────────────────────────────────
// Admin-level configuration. Set once when creating the app.
// Controls which profile fields are visible and what filters exist.

export interface AppConfig {
  // Profile field visibility (admin decides, not user toggleable)
  showAge: boolean
  showDob: boolean
  showZodiac: boolean
  showGender: boolean
  showHeight: boolean
  showWeight: boolean
  showPosition: boolean
  showDistance: boolean

  // Default values for hidden/locked fields
  defaultGender: 'Male' | 'Female' | 'Non-binary'
  defaultSeekingGender: 'Men' | 'Women' | 'Everyone'

  // Preference categories = custom filters for this app
  preferences: PreferenceCategory[]
}

// ─── Feature Unlock Config ────────────────────────────────────────────
// Shared across all apps

export interface FeatureConfig {
  key: string
  label: Record<Lang, string>
  price: number           // stars
  durationDays: number    // 0 = one-off
}

export const UNLOCKABLE_FEATURES: FeatureConfig[] = [
  { key: 'invisibility', label: { en: 'Profile Invisibility', tc: '隱身模式', sc: '隐身模式', ru: 'Невидимка' }, price: 3000, durationDays: 30 },
  { key: 'filters',      label: { en: 'Unrestricted Filtering', tc: '無限制篩選', sc: '无限制筛选', ru: 'Все фильтры' }, price: 2000, durationDays: 30 },
  { key: 'hideAge',      label: { en: 'Hide Age', tc: '隱藏年齡', sc: '隐藏年龄', ru: 'Скрыть возраст' }, price: 1000, durationDays: 30 },
]

export const ONE_OFF_PURCHASES: FeatureConfig[] = [
  { key: 'extraRow',      label: { en: 'Extra Grid Row', tc: '額外行數', sc: '额外行数', ru: '+1 строка' }, price: 1000, durationDays: 0 },
  { key: 'unlockProfile', label: { en: 'Unlock Profile', tc: '解鎖資料', sc: '解锁资料', ru: 'Разблокировать' }, price: 1000, durationDays: 0 },
  { key: 'raffleTicket',  label: { en: 'Raffle Ticket', tc: '抽獎券', sc: '抽奖券', ru: 'Лотерейный билет' }, price: 100, durationDays: 0 },
]

// ─── Payment ──────────────────────────────────────────────────────────

export interface PaymentItem {
  purpose: string
  title: string
  description: string
  price: number
}

// ─── Raffle ───────────────────────────────────────────────────────────

export interface Raffle {
  id: number
  name: string
  ticket_price: number
  countdown_minutes: number
  status: 'active' | 'countdown' | 'drawing' | 'completed'
  created_by: number
  created_at: string
  drawn_at?: string
  winner_id?: number
  prize_description?: string
}

export type RaffleStatus = 'active' | 'countdown' | 'drawing' | 'completed'

// ─── DbUser (Supabase row) ────────────────────────────────────────────

export interface DbUser {
  id: number
  name: string
  dob?: string | null
  gender: string
  height: number
  weight: number
  position?: number | null
  photo_url?: string | null
  tg_username?: string | null
  is_online: boolean
  lat?: number | null
  lng?: number | null
  open_to_messages: boolean
  updated_at: string

  // Visibility toggles stored as bitfield or individual booleans
  show_age: boolean
  show_dob: boolean
  show_zodiac: boolean
  show_gender: boolean
  show_height: boolean
  show_weight: boolean
  show_position: boolean
  show_distance: boolean

  // Seeking
  seeking_gender: string
  seeking_age_min: number
  seeking_age_max: number

  // Preferences stored as preference1-preference4 for backward compat
  preference1?: string | null
  preference2?: string | null
  preference3?: string | null
  preference4?: string | null

  // Feature unlocks
  invisible_until?: string | null
  hide_age: boolean
  hide_age_until?: string | null
  filters_unlocked: boolean
  filters_unlocked_expires_at?: string | null
  grid_rows_unlocked: number

  // Photo
  has_real_photo?: boolean | null
}

export interface UnlockStatus {
  filters_unlocked: boolean
  filters_unlocked_expires_at: string | null
  grid_rows_unlocked: number
  invisible_until: string | null
  hide_age: boolean
  hide_age_until: string | null
  has_real_photo: boolean | null
}
