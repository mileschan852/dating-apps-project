// DB client — thin wrapper around dating-core with table name bound
// This is the COMPLETE superset: all functions HKMOD and LMN may use
import * as db from '@dating/core'

const TABLE = 'users'  // Change to 'lmn_users' for LMN, 'users' for HKMOD

export const hasValidKey = db.hasValidKey

// ─── App-specific DbUser (customize schema per app) ──────────────────
export interface DbUser {
  id: number
  name: string
  photo_url: string | null
  tg_username: string | null
  is_online: boolean
  lat: number | null
  lng: number | null
  open_to_messages: boolean | null
  updated_at: string

  // Birth & physical (unified profile)
  dob: string | null
  gender: string | null
  height: number
  weight: number
  position: number | null

  // Visibility toggles (admin-configured)
  show_age: boolean | null
  show_dob: boolean | null
  show_zodiac: boolean | null
  show_gender: boolean | null
  show_height: boolean | null
  show_weight: boolean | null
  show_position: boolean | null
  show_distance: boolean | null

  // Seeking
  seeking_gender: string | null
  seeking_age_min: number | null
  seeking_age_max: number | null

  // App-defined preferences
  preference1: string | null
  preference2: string | null
  preference3: string | null
  preference4: string | null

  // Feature unlocks
  invisible_until: string | null
  invisible_purchased_at: string | null
  hide_age: boolean | null
  hide_age_until: string | null
  filters_unlocked: boolean | null
  filters_unlocked_expires_at: string | null
  grid_rows_unlocked: number | null
  profile_unlocked: boolean | null
  has_real_photo: boolean | null
}

export type Raffle = db.Raffle

export interface UnlockStatus {
  grid_rows_unlocked: number
  filters_unlocked: boolean
  filters_unlocked_expires_at: string | null
  invisible_until: string | null
  invisible_purchased_at: string | null
  edit_unlocked: boolean | null
  edit_unlocked_expires_at: string | null
  has_real_photo: boolean | null
  unlock_count: number
  hide_age: boolean
  hide_age_until: string | null
}

// ─── User ops ────────────────────────────────────────────────────────
export const upsertUser = (user: Partial<DbUser>) => db.upsertUser(TABLE, user as Partial<db.DbUser>)
export const fetchNearby = (lat: number, lng: number) => db.fetchNearby(TABLE, lat, lng).then(rows => rows as unknown as DbUser[])
export const setOnlineStatus = (userId: number, isOnline: boolean) => db.setOnlineStatus(TABLE, userId, isOnline)
export const deleteUser = (userId: number) => db.deleteUser(TABLE, userId)
export const clearAllUsers = () => db.clearAllUsers(TABLE)

// ─── Unlock / status ─────────────────────────────────────────────────
export const fetchUserUnlockStatus = async (userId: number): Promise<UnlockStatus | null> => {
  const s = await (db as any).fetchUserUnlockStatus(TABLE, userId)
  if (!s) return null
  return {
    grid_rows_unlocked: s.grid_rows_unlocked || 0,
    filters_unlocked: !!s.filters_unlocked,
    filters_unlocked_expires_at: s.filters_unlocked_expires_at || null,
    invisible_until: s.invisible_until || null,
    invisible_purchased_at: s.invisible_purchased_at || null,
    edit_unlocked: s.edit_unlocked ?? null,
    edit_unlocked_expires_at: s.edit_unlocked_expires_at || null,
    has_real_photo: s.has_real_photo || false,
    unlock_count: s.unlock_count || 0,
    hide_age: !!s.hide_age,
    hide_age_until: s.hide_age_until || null,
  }
}
export const updateInvisibleStatus = (userId: number, until: string | null) => db.updateInvisibleStatus(TABLE, userId, until)
export const updateHideAgeStatus = (userId: number, until: string | null) => db.updateHideAgeStatus(TABLE, userId, until)
export const updateProfileUnlockStatus = (userId: number, unlocked: boolean, expiresAt: string | null) => db.updateProfileUnlockStatus(TABLE, userId, unlocked, expiresAt)
export const updateRealPhotoStatus = (userId: number, hasRealPhoto: boolean) => db.updateRealPhotoStatus(TABLE, userId, hasRealPhoto)
export const fetchUserPhotoStatus = (userId: number) => db.fetchUserPhotoStatus(TABLE, userId)
export const relockUserFeatures = (userId: number) => db.relockUserFeatures(TABLE, userId)
export const setGridRowsUnlocked = (userId: number, value: number) => db.setGridRowsUnlocked(TABLE, userId, value)
export const setFiltersUnlocked = (userId: number, unlocked: boolean, expiresAt: string | null) => db.setFiltersUnlocked(TABLE, userId, unlocked, expiresAt)
export const ensureFilterUnlock = (userId: number) => db.ensureFilterUnlock(TABLE, userId)
export const updateUnlockCount = (userId: number, delta: number) => db.updateUnlockCount(TABLE, userId, delta)
export const setUnlockCount = (userId: number, value: number) => db.setUnlockCount(TABLE, userId, value)
export const fetchGlobalUnlock = () => db.fetchGlobalUnlock(TABLE)
export const setGlobalUnlock = db.setGlobalUnlock

// ─── Raffles (table-agnostic) ────────────────────────────────────────
export const getActiveRaffle = db.getActiveRaffle
export const createRaffle = db.createRaffle
export const buyRaffleTicket = db.buyRaffleTicket
export const startRaffleCountdown = db.startRaffleCountdown
export const drawRaffleWinner = db.drawRaffleWinner
export const completeRaffle = db.completeRaffle
export const getRaffleTickets = db.getRaffleTickets
export const setRaffleDrawToNextWednesday = db.setRaffleDrawToNextWednesday

// ─── Photo check (pure function) ─────────────────────────────────────
export const checkRealPhoto = db.checkRealPhoto

// ─── Flying messages (table-agnostic, cast types) ────────────────────
export const insertFlyingMessage = (msg: { text: string; username: string; user_id: number; top_percent: number }) =>
  db.insertFlyingMessage(msg.user_id, msg.username, msg.text)

export const fetchFlyingMessages = async (since: string): Promise<{id: number; text: string; username: string; user_id: number; top_percent: number; created_at: string}[]> => {
  const msgs = await db.fetchFlyingMessages(since)
  return msgs.map(m => ({
    id: m.id,
    text: m.text,
    username: (m as any).username || (m as any).user_name || '',
    user_id: m.user_id,
    top_percent: (m as any).top_percent || 0,
    created_at: m.created_at,
  }))
}
