// Shared Supabase REST Client for ALL dating apps
// Table-agnostic: pass tableName as first argument to every function

// ─── Supabase Config ─────────────────────────────────────────────────

const SUPABASE_URL = 'https://fngcjkclxxodjaiqkfkm.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZ2Nqa2NseHhvZGphaXFrZmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTE4NzUsImV4cCI6MjA5MjU2Nzg3NX0.dpoNP8EO7iZCFP7dzjD33mCdiJ0gxl5lTl6-hPY0HH4'

export const hasValidKey = ANON_KEY.startsWith('eyJ') && ANON_KEY.length > 50

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

// ─── DB Types — Unified Schema ───────────────────────────────────────

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

  // Birth & physical
  dob: string | null
  gender: string | null
  height: number
  weight: number
  position: number | null
  is_side: boolean | null

  // Visibility toggles
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

  // App-defined preferences (each app uses these differently)
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

export interface Raffle {
  id: number
  prize_type: 'filters' | 'invisible'
  ticket_price: number
  target_tickets: number
  current_tickets: number
  status: 'pending' | 'active' | 'completed'
  countdown_started_at: string | null
  ends_at: string | null
  winner_user_id: number | null
  winner_name: string | null
  drawn_at: string | null
}

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

export interface FlyingMessage {
  id: number
  user_id: number
  user_name: string
  text: string
  created_at: string
}

// ─── Distance ────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Core CRUD ───────────────────────────────────────────────────────

export async function upsertUser(tableName: string, user: Partial<DbUser>): Promise<DbUser | null> {
  if (!hasValidKey) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?on_conflict=id`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(user),
    })
    const text = await res.text()
    if (!res.ok) throw new Error(text)
    const data = JSON.parse(text)
    return Array.isArray(data) && data.length > 0 ? data[0] : null
  } catch (err) {
    console.error('upsertUser error:', String(err).substring(0, 200))
    return null
  }
}

/** Fetch full user profile from Supabase — used as fallback when local storage is empty */
export async function fetchUser(tableName: string, userId: number): Promise<DbUser | null> {
  if (!hasValidKey) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}&select=*`, { headers })
    if (!res.ok) return null
    const data = await res.json() as DbUser[]
    return data[0] || null
  } catch { return null }
}

export async function fetchNearby(tableName: string, lat: number, lng: number, limit = 100): Promise<DbUser[]> {
  if (!hasValidKey) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=200`, { headers })
    if (!res.ok) { console.error(`fetchNearby: ${res.status}`); return [] }
    const data = (await res.json()) as DbUser[]
    return data.filter((u): u is typeof u & { lat: number; lng: number } => u.lat !== null && u.lng !== null).map(u => ({ user: u, dist: haversineKm(lat, lng, u.lat, u.lng) })).sort((a, b) => a.dist - b.dist).slice(0, limit).map(d => d.user)
  } catch (err) { console.error('fetchNearby:', err); return [] }
}

export async function setOnlineStatus(tableName: string, userId: number, isOnline: boolean): Promise<void> {
  if (!hasValidKey) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ is_online: isOnline, updated_at: new Date().toISOString() }),
    })
  } catch (err) { console.error('setOnlineStatus:', err) }
}

export async function deleteUser(tableName: string, userId: number): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}`, { method: 'DELETE', headers }); return res.ok } catch { return false }
}

export async function clearAllUsers(_tableName: string): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/users?is_admin=eq.false`, { method: 'DELETE', headers }); return res.ok } catch { return false }
}

// ─── Unlock Status ───────────────────────────────────────────────────

export async function fetchUserUnlockStatus(tableName: string, userId: number): Promise<UnlockStatus | null> {
  if (!hasValidKey) return null
  try {
    const cols = 'grid_rows_unlocked,filters_unlocked,filters_unlocked_expires_at,invisible_until,invisible_purchased_at,edit_unlocked,edit_unlocked_expires_at,has_real_photo,hide_age,hide_age_until'
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}&select=${cols}`, { headers })
    if (!res.ok) return null
    const data = await res.json()
    return data?.[0] || null
  } catch { return null }
}

// ─── Feature Updates ─────────────────────────────────────────────────

export async function updateInvisibleStatus(tableName: string, userId: number, until: string | null): Promise<boolean> {
  if (!hasValidKey) return false
  try {
    const body: Record<string, any> = { invisible_until: until }
    if (until) body.invisible_purchased_at = new Date().toISOString()
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
    return res.ok
  } catch { return false }
}

export async function updateHideAgeStatus(tableName: string, userId: number, until: string | null): Promise<boolean> {
  if (!hasValidKey) return false
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ hide_age: !!until, hide_age_until: until }),
    })
    return res.ok
  } catch { return false }
}

export async function updateProfileUnlockStatus(tableName: string, userId: number, unlocked: boolean, expiresAt: string | null): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}`, { method: 'PATCH', headers, body: JSON.stringify({ profile_unlocked: unlocked, edit_unlocked: unlocked, edit_unlocked_expires_at: expiresAt }) }); return res.ok } catch { return false }
}

export async function setGridRowsUnlocked(tableName: string, userId: number, rows: number): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}`, { method: 'PATCH', headers, body: JSON.stringify({ grid_rows_unlocked: rows }) }); return res.ok } catch { return false }
}

export async function setFiltersUnlocked(tableName: string, userId: number, unlocked: boolean, expiresAt: string | null): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}`, { method: 'PATCH', headers, body: JSON.stringify({ filters_unlocked: unlocked, filters_unlocked_expires_at: expiresAt }) }); return res.ok } catch { return false }
}

export async function ensureFilterUnlock(tableName: string, userId: number): Promise<boolean> {
  if (!hasValidKey) return false
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}&select=filters_unlocked_expires_at`, { headers })
    if (!res.ok) return false
    const data = await res.json()
    if (data?.[0]?.filters_unlocked_expires_at) return true
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}`, { method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify({ filters_unlocked_expires_at: expiresAt }) })
    return patchRes.ok
  } catch { return false }
}

export async function relockUserFeatures(tableName: string, userId: number): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}`, { method: 'PATCH', headers, body: JSON.stringify({ unlock_count: 0, filters_unlocked: false, grid_rows_unlocked: 0 }) }); return res.ok } catch { return false }
}

// ─── Photo ───────────────────────────────────────────────────────────

export async function checkPhotoGate(tableName: string, userId: number, _photoUrl: string): Promise<{ hasRealPhoto: boolean }> {
  if (!hasValidKey) return { hasRealPhoto: false }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}&select=has_real_photo`, { headers })
    if (!res.ok) return { hasRealPhoto: false }
    const data = await res.json()
    return { hasRealPhoto: data?.[0]?.has_real_photo ?? false }
  } catch { return { hasRealPhoto: false } }
}

export function checkRealPhoto(photoUrl: string | null | undefined): boolean {
  if (!photoUrl) return false
  return !photoUrl.includes('default') && !photoUrl.includes('placeholder')
}

export async function updateRealPhotoStatus(tableName: string, userId: number, hasRealPhoto: boolean): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}`, { method: 'PATCH', headers, body: JSON.stringify({ has_real_photo: hasRealPhoto }) }); return res.ok } catch { return false }
}

export async function fetchUserPhotoStatus(tableName: string, userId: number): Promise<{ has_real_photo: boolean } | null> {
  if (!hasValidKey) return null
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=eq.${userId}&select=has_real_photo`, { headers }); if (!res.ok) return null; const data = await res.json() as { has_real_photo: boolean }[]; return data[0] || null } catch { return null }
}

// ─── Raffle ──────────────────────────────────────────────────────────

export async function getActiveRaffle(): Promise<Raffle | null> {
  if (!hasValidKey) return null
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/raffles?status=in.(waiting,active)&order=created_at.desc&limit=1`, { headers }); if (!res.ok) return null; const data = await res.json(); return data?.[0] || null } catch { return null }
}

export async function createRaffle(prizeType: 'filters' | 'invisible'): Promise<Raffle | null> {
  if (!hasValidKey) return null
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/raffles`, { method: 'POST', headers: { ...headers, 'Prefer': 'return=representation' }, body: JSON.stringify({ prize_type: prizeType, status: 'waiting', target_tickets: 10, tickets_sold: 0 }) }); if (!res.ok) return null; const data = await res.json(); return data?.[0] || null } catch { return null }
}

export async function startRaffleCountdown(raffleId: number): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/raffles?id=eq.${raffleId}`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'countdown', countdown_started_at: new Date().toISOString() }) }); return res.ok } catch { return false }
}

export async function completeRaffle(raffleId: number, winnerUserId: number, winnerName: string): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/raffles?id=eq.${raffleId}`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'completed', winner_user_id: winnerUserId, winner_name: winnerName }) }); return res.ok } catch { return false }
}

export async function getRaffleTickets(raffleId: number): Promise<number> {
  if (!hasValidKey) return 0
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/raffle_tickets?raffle_id=eq.${raffleId}&select=count`, { headers }); if (!res.ok) return 0; const data = await res.json() as { count: number }[]; return data[0]?.count || 0 } catch { return 0 }
}

export async function buyRaffleTicket(raffleId: number, userId: number): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/raffle_tickets`, { method: 'POST', headers, body: JSON.stringify({ raffle_id: raffleId, user_id: userId }) }); return res.ok } catch { return false }
}

export async function drawRaffleWinner(raffleId: number): Promise<{ user_id: number; name: string } | null> {
  if (!hasValidKey) return null
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/draw_raffle_winner`, { method: 'POST', headers, body: JSON.stringify({ p_raffle_id: raffleId }) }); if (!res.ok) return null; const data = await res.json(); if (!data?.id) return null; return { user_id: data.id, name: data.name || 'Unknown' } } catch { return null }
}

export async function setRaffleDrawToNextWednesday(raffleId: number): Promise<boolean> {
  if (!hasValidKey) return false
  try {
    const now = new Date(); const day = now.getDay(); const daysUntilWed = (3 - day + 7) % 7 || 7
    const nextWed = new Date(now); nextWed.setDate(now.getDate() + daysUntilWed); nextWed.setHours(20, 0, 0, 0)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/raffles?id=eq.${raffleId}`, { method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify({ ends_at: nextWed.toISOString() }) })
    return res.ok
  } catch { return false }
}

// ─── Flying Messages ─────────────────────────────────────────────────

export async function insertFlyingMessage(userId: number, userName: string, text: string): Promise<boolean> {
  if (!hasValidKey) return false
  try { const res = await fetch(`${SUPABASE_URL}/rest/v1/flying_messages`, { method: 'POST', headers, body: JSON.stringify({ user_id: userId, username: userName, text, top_percent: Math.random() * 80 + 10 }) }); return res.ok } catch { return false }
}

export async function fetchFlyingMessages(since?: string): Promise<FlyingMessage[]> {
  if (!hasValidKey) return []
  try { const sinceParam = since ? `&created_at=gte.${encodeURIComponent(since)}` : ''; const res = await fetch(`${SUPABASE_URL}/rest/v1/flying_messages?select=*&order=created_at.desc&limit=50${sinceParam}`, { headers }); if (!res.ok) return []; return await res.json() as FlyingMessage[] } catch { return [] }
}

// ─── Factory ─────────────────────────────────────────────────────────

export interface SupabaseClient {
  upsertUser: (user: Partial<DbUser>) => Promise<DbUser | null>
  fetchNearby: (lat: number, lng: number, limit?: number) => Promise<DbUser[]>
  setOnlineStatus: (userId: number, isOnline: boolean) => Promise<void>
  deleteUser: (userId: number) => Promise<boolean>
  clearAllUsers: () => Promise<boolean>
  fetchUserUnlockStatus: (userId: number) => Promise<UnlockStatus | null>
  updateUserRealPhoto: (userId: number, hasRealPhoto: boolean) => Promise<boolean>
  setGridRowsUnlocked: (userId: number, value: number) => Promise<boolean>
  setFiltersUnlocked: (userId: number, unlocked: boolean, expiresAt: string | null) => Promise<boolean>
  updateInvisibleStatus: (userId: number, until: string | null) => Promise<boolean>
  updateHideAgeStatus: (userId: number, until: string | null) => Promise<boolean>
  relockUserFeatures: (userId: number) => Promise<boolean>
  ensureFilterUnlock: (userId: number) => Promise<boolean>
  updateRealPhotoStatus: (userId: number, hasRealPhoto: boolean) => Promise<boolean>
  fetchUserPhotoStatus: (userId: number) => Promise<{ has_real_photo: boolean } | null>
}

export function createSupabaseClient(tableName: string): SupabaseClient {
  return {
    upsertUser: (user) => upsertUser(tableName, user),
    fetchNearby: (lat, lng, limit) => fetchNearby(tableName, lat, lng, limit),
    setOnlineStatus: (userId, isOnline) => setOnlineStatus(tableName, userId, isOnline),
    deleteUser: (userId) => deleteUser(tableName, userId),
    clearAllUsers: () => clearAllUsers(tableName),
    fetchUserUnlockStatus: (userId) => fetchUserUnlockStatus(tableName, userId),
    updateUserRealPhoto: (userId, hasRealPhoto) => updateRealPhotoStatus(tableName, userId, hasRealPhoto),
    setGridRowsUnlocked: (userId, value) => setGridRowsUnlocked(tableName, userId, value),
    setFiltersUnlocked: (userId, unlocked, expiresAt) => setFiltersUnlocked(tableName, userId, unlocked, expiresAt),
    updateInvisibleStatus: (userId, until) => updateInvisibleStatus(tableName, userId, until),
    updateHideAgeStatus: (userId, until) => updateHideAgeStatus(tableName, userId, until),
    relockUserFeatures: (userId) => relockUserFeatures(tableName, userId),
    ensureFilterUnlock: (userId) => ensureFilterUnlock(tableName, userId),
    updateRealPhotoStatus: (userId, hasRealPhoto) => updateRealPhotoStatus(tableName, userId, hasRealPhoto),
    fetchUserPhotoStatus: (userId) => fetchUserPhotoStatus(tableName, userId),
  }
}
