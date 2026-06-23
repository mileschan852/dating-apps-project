// ====================================================================
// APP BASE — Complete Dating App Template
//
// HOW TO CUSTOMIZE (5 things):
// 1. APP_CONFIG — which fields are visible, default gender values
// 2. PREFERENCE_CATEGORIES — your app's filter categories with colours
// 3. Admin constants (ADMIN_IDS, WORKER_URL, GROUP_CHAT_URL, etc.)
// 4. Branding (logo, appName, CSS colour)
// 5. renderTileBottom — what shows under each grid tile
//
// Everything else works out of the box.
// ====================================================================

import {
  getTg, isInTelegram, getTimeAgo, getDistance, formatDist,
  getDefaultLang, isAdminUser, createCloudKeys, createStorage,
  getZodiac, getZodiacEmoji, getAge,
  isProfileComplete, getMissingFields,
  useAdminRecheck, useRaffleActions, useRefreshCooldown,
  useHeartbeat, useFlyingMessages,
  useFilterUnlock, useGridUnlock, useInvisibleMode,
  useProfileUnlock, useChannelFollow, useHideAge,
  type Lang, type UserProfile, type AppConfig, type PreferenceCategory, type PreferenceOption,
} from '@dating/core'
import {
  LocationGate, FlyingMessagesOverlay, BottomNav,
  TopBar, StatsBar, ProfileGrid, ProfileView,
  FilterButton, ToggleButton,
} from '@dating/ui'
import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import logoImg from './assets/hkmod-logo.png'
import logoAnim from './assets/hkmod-logo-animated.mp4'
import { t, getLangLabel } from './lib/i18n'
import { Lock } from 'lucide-react'
import {
  upsertUser, fetchUser, fetchNearby, hasValidKey,
  fetchUserUnlockStatus, insertFlyingMessage,
  updateInvisibleStatus, updateHideAgeStatus, updateProfileUnlockStatus,
  setGridRowsUnlocked as saveGridRowsUnlocked,
  setFiltersUnlocked as saveFiltersUnlocked, ensureFilterUnlock,
  type DbUser, type Raffle, type UnlockStatus,
} from './lib/supabase'

// ═════════════════════════════════════════════════════════════════════
// 1. APP CONFIG — Which fields are visible, preferences, defaults
// ═════════════════════════════════════════════════════════════════════

// MyApp: gender hidden (all users are Male seeking Men)
const APP_CONFIG: AppConfig = {
  showAge: true,
  showDob: false,
  showZodiac: true,
  showGender: false,            // Hidden — all users are Male
  showHeight: true,
  showWeight: true,
  showPosition: true,
  showDistance: true,
  defaultGender: 'Male',
  defaultSeekingGender: 'Men',
  preferences: [
    // Safety — LOCKED on grid (requires filter unlock)
    {
      key: 'safety',
      label: { en: 'Safe', tc: '安全', sc: '安全', ru: 'Безопасность' },
      defaultValue: 'Safe',
      locked: true,
      options: [
        { value: 'Safe', label: { en: 'Safe', tc: '安全', sc: '安全', ru: 'Безопасно' }, colour: 'bg-green-500/20 text-green-400 border-green-500/30' },
        { value: 'Raw', label: { en: 'Raw', tc: '無套', sc: '无套', ru: 'Raw' }, colour: 'bg-red-500/20 text-red-400 border-red-500/30' },
      ],
    },
    // Party — LOCKED on grid (requires filter unlock). Party✓ stored as same DB value but displayed differently
    {
      key: 'party',
      label: { en: 'Party', tc: '玩樂', sc: '玩乐', ru: 'Вечеринка' },
      defaultValue: 'Clean',
      locked: true,
      options: [
        { value: 'Clean', label: { en: 'Clean', tc: '清醒', sc: '清醒', ru: 'Чисто' }, colour: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        { value: 'Party', label: { en: 'Party', tc: '玩野', sc: '玩野', ru: 'Party' }, colour: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        { value: 'PartyPlus', label: { en: 'Party✓', tc: '玩野✓', sc: '玩野✓', ru: 'Party✓' }, colour: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
      ],
    },
    // Location — FREE (no unlock needed), defaults to All
    {
      key: 'location',
      label: { en: 'Where', tc: '地點', sc: '地点', ru: 'Где' },
      defaultValue: 'All',
      locked: false,
      options: [
        { value: 'Travel', label: { en: 'Travel', tc: '可出門', sc: '可出门', ru: 'Приеду' }, colour: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
        { value: 'Host', label: { en: 'Host', tc: '可接待', sc: '可接待', ru: 'Принимаю' }, colour: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
        { value: 'Sauna', label: { en: 'Sauna', tc: '桑拿', sc: '桑拿', ru: 'Сауна' }, colour: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
        { value: 'Outdoor', label: { en: 'Outdoor', tc: '戶外', sc: '户外', ru: 'На улице' }, colour: 'bg-lime-500/20 text-lime-400 border-lime-500/30' },
      ],
    },
  ],
}

// ═════════════════════════════════════════════════════════════════════
// 2. ADMIN CONFIG — Change these for your app
// ═════════════════════════════════════════════════════════════════════

const ADMIN_IDS = [1231127407, 6837870949]
const ADMIN_USERNAMES = ['HKMembersOnly', 'hkmembersonly', 'MilesChan852', 'mileschan852']
const WORKER_URL = 'https://hkmo-d.mileschan852.workers.dev/createinvoice'
const GROUP_CHAT_URL = 'https://t.me/HKMembersOnlyChat'
const CHANNEL_URL = 'https://t.me/HKMO_D'
const TABLE_NAME = 'users'

// ═════════════════════════════════════════════════════════════════════
// 3. TYPES & STORAGE
// ═════════════════════════════════════════════════════════════════════

type View = 'MAIN' | 'OWN_PROFILE'

const APP_PREFIX = 'hk'
const CLOUD = createCloudKeys(APP_PREFIX)
const storage = createStorage({ prefix: APP_PREFIX })

// ═════════════════════════════════════════════════════════════════════
// 4. DB → PROFILE — Maps Supabase row to UserProfile
// ═════════════════════════════════════════════════════════════════════

function dbToProfile(u: DbUser, myLat: number, myLng: number): UserProfile {
  const dist = u.lat && u.lng ? getDistance(myLat, myLng, u.lat, u.lng) : 0
  const dob = u.dob || undefined
  const preferences: Record<string, string> = {}
  if (u.preference1) preferences.safety = u.preference1
  if (u.preference2) preferences.role = u.preference2
  if (u.preference3) preferences.party = u.preference3
  if (u.preference4) preferences.location = u.preference4

  return {
    id: String(u.id), name: u.name,
    dob, age: getAge(dob), zodiac: getZodiac(dob),
    gender: APP_CONFIG.showGender ? ((u.gender as 'Male' | 'Female' | 'Non-binary') || APP_CONFIG.defaultGender) : APP_CONFIG.defaultGender,
    height: u.height || 0, weight: u.weight || 0, position: u.position ?? 0.5, isSide: u.is_side ?? false,
    showAge: true, showDob: false, showZodiac: true, showGender: true,
    showHeight: true, showWeight: true, showPosition: true, showDistance: true,
    seekingGender: APP_CONFIG.showGender ? ((u.seeking_gender as 'Men' | 'Women' | 'Everyone') || APP_CONFIG.defaultSeekingGender) : APP_CONFIG.defaultSeekingGender,
    seekingAgeMin: u.seeking_age_min ?? 18, seekingAgeMax: u.seeking_age_max ?? 99,
    preferences,
    tgUsername: u.tg_username || undefined,
    tgPhotoUrl: u.photo_url?.startsWith('http') ? u.photo_url : undefined,
    tgPhotos: u.photo_url?.startsWith('http') ? [u.photo_url] : [],
    hasPhoto: !!(u.photo_url && u.photo_url.startsWith('http')),
    hasRealPhoto: u.has_real_photo ?? undefined,
    isOnline: u.is_online ?? false, distance: Math.round(dist),
    lat: u.lat ?? undefined, lng: u.lng ?? undefined,
    openToMessages: u.open_to_messages ?? false, updatedAt: u.updated_at,
    isInvisible: !!u.invisible_until && new Date(u.invisible_until).getTime() > Date.now(),
    invisibleUntil: u.invisible_until ?? undefined,
    hideAge: !!u.hide_age,
    hideAgeUntil: u.hide_age_until ?? undefined,
    filtersUnlocked: u.filters_unlocked ?? false,
    filtersUnlockedUntil: u.filters_unlocked_expires_at ?? undefined,
    profileUnlocked: u.profile_unlocked ?? false,
  }
}

// Maps preference index to CLOUD storage key (pref1, pref2, pref3, pref4)
const getPrefStorageKey = (idx: number): string => {
  const keys = [CLOUD.pref1, CLOUD.pref2, CLOUD.pref3, CLOUD.pref4]
  return keys[idx] || CLOUD.pref1
}

// ═════════════════════════════════════════════════════════════════════
// 5. PROFILE → DB — Maps UserProfile back to Supabase row
// ═════════════════════════════════════════════════════════════════════

function profileToDb(p: UserProfile): Partial<DbUser> {
  const prefs = APP_CONFIG.preferences
  return {
    name: p.name, dob: p.dob || null,
    gender: p.gender, height: p.height, weight: p.weight,
    position: p.isSide ? null : (p.position ?? null),
    is_side: p.isSide || false,
    photo_url: p.tgPhotoUrl || null,
    tg_username: p.tgUsername || null, open_to_messages: p.openToMessages,
    is_online: true, updated_at: new Date().toISOString(),
    seeking_gender: p.seekingGender, seeking_age_min: p.seekingAgeMin, seeking_age_max: p.seekingAgeMax,
    preference1: p.preferences.safety || null,
    preference2: p.preferences.role || null,
    preference3: p.preferences.party || null,
    preference4: p.preferences.location || null,
    profile_unlocked: p.profileUnlocked,
    hide_age: p.hideAge,
  }
}

// ═════════════════════════════════════════════════════════════════════
// 6. TIPS — Rotating tips below stats bar
// ═════════════════════════════════════════════════════════════════════

function UnlockTipCycle({ lang, isPremium, gridRowsUnlocked, channelFollowUnlock, onClaimChannelFollow }: { lang: Lang; isPremium: boolean; gridRowsUnlocked: number; channelFollowUnlock: number; onClaimChannelFollow: () => void }) {
  const [idx, setIdx] = useState(0)
  const tips: Record<Lang, string[]> = {
    en: [`Base: 2 rows free`, isPremium ? `Premium: +1 row` : `Premium: +1 row (inactive)`, `Purchased: ${gridRowsUnlocked} rows`, `Add a Telegram photo +1`, channelFollowUnlock ? `Channel: +1 row ✅` : `Join channel +1`, `Buy rows with ⭐ Stars`],
    tc: [`基礎: 2 行免費`, isPremium ? `Premium: +1 行` : `Premium: +1 行 (未激活)`, `已購: ${gridRowsUnlocked} 行`, `加入 Telegram 頭像 +1`, channelFollowUnlock ? `頻道: +1 行 ✅` : `加入頻道 +1`, `用 ⭐ 星星購買行數`],
    sc: [`基础: 2 行免费`, isPremium ? `Premium: +1 行` : `Premium: +1 行 (未激活)`, `已购: ${gridRowsUnlocked} 行`, `加入 Telegram 头像 +1`, channelFollowUnlock ? `频道: +1 行 ✅` : `加入频道 +1`, `用 ⭐ 星星购买行数`],
    ru: [`База: 2 строки бесплатно`, isPremium ? `Premium: +1 строка` : `Premium: +1 строка (не активен)`, `Куплено: ${gridRowsUnlocked} строк`, `Добавь фото в Telegram +1`, channelFollowUnlock ? `Канал: +1 строка ✅` : `Подпишись на канал +1`, `Купить строки за ⭐`],
  }
  const list = tips[lang] || tips.en
  useEffect(() => { const i = setInterval(() => setIdx(i => (i + 1) % list.length), 5000); return () => clearInterval(i) }, [list.length])
  const current = list[idx % list.length]
  const isChannelTip = idx % list.length === 4
  return (
    <button onClick={() => { if (isChannelTip && !channelFollowUnlock) onClaimChannelFollow(); else setIdx(i => (i + 1) % list.length) }} className="ml-auto flex items-center gap-1 text-[9px] text-[#8E8E93] nav-press">
      <span className="w-4 h-4 rounded-full bg-[#2C2C2E] flex items-center justify-center">💡</span>
      <span className={`truncate max-w-[140px] ${isChannelTip && !channelFollowUnlock ? 'text-[#5AC8FA]' : ''}`}>{current}</span>
    </button>
  )
}

// ── Position → Role label mapping ──────────────────────────────────
function getRoleLabel(position: number | undefined, isSide?: boolean): string {
  if (isSide) return 'Side'
  if (position === undefined) return 'V'
  if (position === 0) return 'B'
  if (position <= 0.4) return 'VB'
  if (position === 0.5) return 'V'
  if (position <= 0.9) return 'VT'
  return 'T'
}

// ── Role opposite matching: B/VB seek V/VT/T, VT/T seek B/VB/V, V seeks all ──
function getOppositeRole(position: number | undefined, isSide?: boolean): string | null {
  if (isSide) return 'Side'
  if (position === undefined) return null
  if (position < 0.5) return 'V'
  if (position > 0.5) return 'V'
  return null // V shows all
}

// ═════════════════════════════════════════════════════════════════════
// 7. MAIN SCREEN — Grid + filters. CUSTOMIZE: filter buttons.
// ═════════════════════════════════════════════════════════════════════

function MainScreen({
  ownProfile, users, onViewOwnProfile, onViewPhoto,
  showDbWarning, isLoadingUsers, lang, setLang,
  onRefresh, isAdmin, filtersUnlocked, onPromptUnlock,
  onPromptFilterUnlock, onToggleInvisible, gridRowsUnlocked,
  lastRefreshTime, setLastRefreshTime, isInvisible,
  invisiblePurchased, raffle, onBuyRaffleTicket,
  onStartNextRaffle, onPromptUnlockProfile, isPremium,
  channelFollowUnlock, onClaimChannelFollow,
}: {
  ownProfile: UserProfile; users: UserProfile[]
  onViewOwnProfile: () => void; onViewPhoto: (u: UserProfile) => void
  showDbWarning: boolean; isLoadingUsers: boolean
  lang: Lang; setLang: (l: Lang) => void; onRefresh: () => void; isAdmin: boolean
  filtersUnlocked: boolean; onPromptUnlock: () => void; onPromptFilterUnlock: () => void
  onToggleInvisible: () => void; gridRowsUnlocked: number
  lastRefreshTime: number; setLastRefreshTime: (t: number) => void
  isInvisible: boolean; invisiblePurchased: boolean
  raffle: Raffle | null; onBuyRaffleTicket: () => void; onStartNextRaffle: () => void
  onPromptUnlockProfile: () => void; isPremium: boolean
  channelFollowUnlock: number; onClaimChannelFollow: () => void
}) {
  const [onlineOnly, setOnlineOnly] = useState(false)

  // Preference filter states — one per preference category
  const [prefFilters, setPrefFilters] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = { role: 'All' }
    // Unlocked filters default to "All", locked filters use their config default
    APP_CONFIG.preferences.forEach((cat: PreferenceCategory) => {
      defaults[cat.key] = cat.locked ? (cat.defaultValue || 'All') : 'All'
    })
    return defaults
  })

  // Set role filter default based on user's position (opposite matching)
  useEffect(() => {
    const opp = getOppositeRole(ownProfile.position, ownProfile.isSide)
    if (opp && prefFilters.role === 'All') {
      setPrefFilters(prev => ({ ...prev, role: opp }))
    }
  }, [ownProfile.position, ownProfile.isSide])

  const LANG_CYCLE: Lang[] = ['en', 'tc', 'sc', 'ru']
  const cycleLang = () => { const idx = LANG_CYCLE.indexOf(lang); const next = LANG_CYCLE[(idx + 1) % LANG_CYCLE.length]; setLang(next); storage.set(CLOUD.lang, next) }

  const cyclePref = (key: string) => {
    // Special case: hasPic toggle (not in APP_CONFIG.preferences)
    if (key === 'hasPic') {
      setPrefFilters(prev => ({ ...prev, hasPic: prev.hasPic === 'true' ? 'false' : 'true' }))
      return
    }
    const cat = APP_CONFIG.preferences.find((c: PreferenceCategory) => c.key === key)
    if (!cat) return
    const values = ['All', ...cat.options.map((o: PreferenceOption) => o.value)]
    const idx = values.indexOf(prefFilters[key] || 'All')
    setPrefFilters(prev => ({ ...prev, [key]: values[(idx + 1) % values.length] }))
  }

  // Role filter cycles: All → Bottom → VB → V → VT → T → Side → All
  const cycleRole = () => {
    const values = ['All', 'Bottom', 'VB', 'V', 'VT', 'T', 'Side']
    const idx = values.indexOf(prefFilters.role || 'All')
    setPrefFilters(prev => ({ ...prev, role: values[(idx + 1) % values.length] }))
  }

  // Role filter display label
  const getRoleFilterLabel = (val: string) => {
    const labels: Record<string, string> = { All: 'All', Bottom: 'B', VB: 'VB', V: 'V', VT: 'VT', T: 'T', Side: 'Side' }
    return labels[val] || val
  }

  // Online threshold
  const ONLINE_THRESHOLD_MS = 15 * 60 * 1000
  const isRecentlyActive = (u: UserProfile) => { if (u.id === ownProfile.id) return true; if (!u.updatedAt) return false; return Date.now() - new Date(u.updatedAt).getTime() < ONLINE_THRESHOLD_MS }

  // Grid assembly
  const patchedOwn = { ...ownProfile, isInvisible: isInvisible || false }
  const allGrid = [patchedOwn, ...users.filter(u => u.id !== ownProfile.id)]
  const visible = isAdmin ? allGrid : allGrid.filter(u => u.id === ownProfile.id || !u.isInvisible)

  // Filter logic — CUSTOMIZE: add your filter conditions here
  const filtered = visible.filter((u) => {
    if (u.id === ownProfile.id) return true
    if (onlineOnly && !isRecentlyActive(u)) return false
    if (u.tgUsername === '_test_') return false
    // Has pic filter
    if (prefFilters.hasPic === 'true' && !u.hasPhoto) return false
    // Role filter — maps to position ranges
    const roleFilter = prefFilters.role || 'All'
    if (roleFilter !== 'All') {
      if (roleFilter === 'Side') { if (!u.isSide) return false }
      else if (u.isSide) return false // Side users don't match other role filters
      else if (roleFilter === 'Bottom') { if (u.position !== 0) return false }
      else if (roleFilter === 'VB') { if (u.position === undefined || u.position <= 0 || u.position > 0.5) return false }
      else if (roleFilter === 'V') { if (u.position !== 0.5) return false }
      else if (roleFilter === 'VT') { if (u.position === undefined || u.position <= 0.5 || u.position > 1) return false }
      else if (roleFilter === 'T') { if (u.position !== 1) return false }
    }
    // Preference filters (safety, party, location)
    for (const cat of APP_CONFIG.preferences) {
      const selected = prefFilters[cat.key]
      if (selected && selected !== 'All' && u.preferences[cat.key] !== selected) return false
    }
    // Party filter: Party sees Party+PartyPlus, PartyPlus only sees PartyPlus
    if (prefFilters.party === 'Party' && u.preferences?.party !== 'Party' && u.preferences?.party !== 'PartyPlus') return false
    if (prefFilters.party === 'PartyPlus' && u.preferences?.party !== 'PartyPlus') return false
    return true
  }).sort((a, b) => { if (a.id === ownProfile.id) return -1; if (b.id === ownProfile.id) return 1; return (a.distance || Infinity) - (b.distance || Infinity) })

  const matchingIds = new Set(filtered.map(u => u.id))
  const nonMatching = visible.filter(u => !matchingIds.has(u.id)).sort((a, b) => { if (a.id === ownProfile.id) return -1; if (b.id === ownProfile.id) return 1; return (a.distance || Infinity) - (b.distance || Infinity) })
  const sortedUsers = [...filtered, ...nonMatching]

  const effectiveRows = 2 + gridRowsUnlocked + (isPremium ? 1 : 0) + channelFollowUnlock
  const unlockedSlots = effectiveRows * 5
  const totalRealUsers = sortedUsers.length
  const hasMoreUsers = totalRealUsers > unlockedSlots

  return (
    <div className="flex-1 overflow-y-auto min-h-0 pb-20">
      <TopBar
        logo={<img src={logoImg} alt="App" className="w-8 h-8 rounded-full object-cover" />}
        appName="MyApp" raffle={raffle} isAdmin={isAdmin}
        onBuyRaffleTicket={onBuyRaffleTicket} onStartNextRaffle={onStartNextRaffle}
        lang={lang} isInvisible={isInvisible} invisiblePurchased={invisiblePurchased}
        onToggleInvisible={onToggleInvisible} onPromptUnlockProfile={onPromptUnlockProfile}
        lastRefreshTime={lastRefreshTime} onRefresh={onRefresh}
        langLabel={getLangLabel(lang)} onCycleLang={cycleLang}
      />

      <StatsBar lang={lang} isPremium={isPremium} gridRowsUnlocked={gridRowsUnlocked}
        channelFollowUnlock={channelFollowUnlock} hasRealPhoto={ownProfile.hasRealPhoto} appVersion="1H">
        <UnlockTipCycle lang={lang} isPremium={isPremium} gridRowsUnlocked={gridRowsUnlocked}
          channelFollowUnlock={channelFollowUnlock} onClaimChannelFollow={onClaimChannelFollow} />
      </StatsBar>

      {showDbWarning && (
        <div className="mx-3 mt-2 bg-[var(--app-primary)]/10 border border-[var(--app-primary)]/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <Lock className="w-4 h-4 text-[var(--app-primary)] flex-shrink-0 mt-0.5" />
          <div><p className="text-[var(--app-primary)] text-xs font-semibold">{t(lang, 'dbNotConfigured')}</p><p className="text-[#8E8E93] text-[10px]">{t(lang, 'dbConfigHint')}</p></div>
        </div>
      )}

      {/* ═══ FILTER BAR — CUSTOMIZE: add your filter buttons here ═══ */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {/* Online toggle: All / Online */}
          <ToggleButton active={onlineOnly} onClick={() => setOnlineOnly(!onlineOnly)}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${onlineOnly ? 'bg-[#00D4AA]' : 'bg-[#8E8E93]'}`} />
            {onlineOnly ? 'Online' : 'All'}
          </ToggleButton>

          {/* Has Pic toggle: All / Has Pic */}
          <ToggleButton active={prefFilters.hasPic === 'true'} onClick={() => cyclePref('hasPic')}>
            📷 {prefFilters.hasPic === 'true' ? 'Has Pic' : 'All'}
          </ToggleButton>

          <div className="w-px h-4 bg-[#2C2C2E] flex-shrink-0" />

          {/* Preference filter buttons — auto-generated from APP_CONFIG */}
          {APP_CONFIG.preferences.map((cat: PreferenceCategory) => {
            const selected = prefFilters[cat.key] || 'All'
            const opt = cat.options.find((o: PreferenceOption) => o.value === selected)
            const isLocked = cat.locked && !filtersUnlocked && !isAdmin
            return (
              <FilterButton key={cat.key} active={selected !== 'All'}
                onClick={() => isLocked ? onPromptFilterUnlock() : cyclePref(cat.key)}
                colorClass={opt?.colour || undefined}
                locked={isLocked}>
                {selected === 'All' ? (cat.label[lang] || cat.label['en']) : (opt?.label[lang] || opt?.label['en'] || selected)}
              </FilterButton>
            )
          })}

          <div className="w-px h-4 bg-[#2C2C2E] flex-shrink-0" />

          {/* Role filter — cycles All/B/VB/V/VT/T/Side */}
          <FilterButton
            active={prefFilters.role !== 'All'}
            onClick={() => filtersUnlocked || isAdmin ? cycleRole() : onPromptFilterUnlock()}
            locked={!filtersUnlocked && !isAdmin}
            colorClass={'bg-purple-500/20 text-purple-400 border-purple-500/30'}>
            {getRoleFilterLabel(prefFilters.role || 'All')}
          </FilterButton>
        </div>
      </div>

      {/* Grid */}
      <div className="px-3">
        {isLoadingUsers && users.length === 0 && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--app-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[#8E8E93] text-xs">{t(lang, 'findingMembers')}</p>
          </div>
        )}
        <ProfileGrid
          users={sortedUsers.filter(u => u.id !== ownProfile.id) as any}
          ownProfile={ownProfile}
          unlockedSlots={unlockedSlots} totalRealUsers={totalRealUsers}
          hasMoreUsers={hasMoreUsers} onPromptUnlock={onPromptUnlock}
          onViewOwnProfile={onViewOwnProfile} onViewPhoto={onViewPhoto}
          isAdmin={isAdmin} isLoading={isLoadingUsers && users.length === 0}
          matchingIds={matchingIds} logoUrl={logoImg}
          renderTileBottom={(user: any) => {
            const roleLabel = user.isSide ? 'Side' : (typeof user.position === 'number' ? getRoleLabel(user.position) : '')
            return (
              <div className="flex items-center justify-between">
                <p className="text-[var(--app-primary)] text-[7px] font-medium">{formatDist(user.distance ?? 0)}</p>
                <p className="text-[#8E8E93] text-[6px]">{getTimeAgo(user.updatedAt)}</p>
                {roleLabel && <p className="text-[var(--app-primary)] text-[6px] font-bold">{roleLabel}</p>}
              </div>
            )
          }}
        />
      </div>

      <div className="px-3 pt-2 flex items-center justify-between text-[10px] text-[#8E8E93]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA]" />{lang === 'en' ? 'Online' : lang === 'ru' ? 'Онлайн' : '在線'}</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#8E8E93]" />{t(lang, 'offlineStatus')}</span>
        </div>
        <span className="text-[var(--app-primary)]">{t(lang, 'youOrangeBorder')}</span>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════
// 8. APP — Root component. ALL HOOKS, EFFECTS, HANDLERS, VIEWS.
//    No changes needed below this line for a basic app.
// ═════════════════════════════════════════════════════════════════════

// ── Telegram-only gate ───────────────────────────────────────────────
function TelegramGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false)
  const inTg = isInTelegram()
  useEffect(() => { setChecked(true) }, [])
  if (!checked) return <div className="h-screen bg-black" />
  if (!inTg) {
    return (
      <div className="h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
        <img src={logoImg} alt="MyApp" className="w-20 h-20 mb-4 rounded-2xl" />
        <h1 className="text-white text-xl font-bold mb-2">Open in Telegram</h1>
        <p className="text-[#8E8E93] text-sm mb-6">This app only works inside Telegram as a Mini App.</p>
        <a href="https://t.me/HKMO_D_Bot" className="gradient-btn px-6 py-3 rounded-xl text-white font-semibold text-sm">
          Open @HKMO_D_Bot in Telegram
        </a>
      </div>
    )
  }
  return <>{children}</>
}

export default function App() {
  const [view, setView] = useState<View>('MAIN')
  const [showSplash, setShowSplash] = useState(true)
  const [ownProfile, setOwnProfile] = useState<UserProfile>({
    id: 'own', name: '', age: 0, height: 178, weight: 72,
    position: 0.5, isSide: false, isOnline: true, distance: 0,
    openToMessages: false, tgUsername: '', tgPhotoUrl: '', tgPhotos: [],
    hasPhoto: false, hasRealPhoto: undefined,
    isInvisible: false,
    gender: APP_CONFIG.defaultGender,
    seekingGender: APP_CONFIG.defaultSeekingGender,
    preferences: { safety: 'Raw', role: 'Verse', location: 'Travel', party: 'Clean' },
    showAge: true, showDob: false, showZodiac: true, showGender: true,
    showHeight: true, showWeight: true, showPosition: true, showDistance: true,
    seekingAgeMin: 18, seekingAgeMax: 99,
    hideAge: false, filtersUnlocked: false, profileUnlocked: false,
  })
  const [users, setUsers] = useState<UserProfile[]>([])
  const [photoOverlay, setPhotoOverlay] = useState<UserProfile | null>(null)
  const [locationGranted, setLocationGranted] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [groupCheck, setGroupCheck] = useState<'checking' | 'member' | 'not_member'>('checking')
  const [lang, setLang] = useState<Lang>(getDefaultLang())
  const [starsPaidFor, setStarsPaidFor] = useState<Set<string>>(new Set())
  const [initComplete, setInitComplete] = useState(false) // True after storage + DB load finishes
  const [isPremium, setIsPremium] = useState(false)
  const [raffle, setRaffle] = useState<Raffle | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [editProfileUnlocked, setEditProfileUnlocked] = useState(false)

  const tgUserId = useRef<number | null>(null)
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── All 11 hooks ───────────────────────────────────────────────────
  useAdminRecheck({ isAdmin, setIsAdmin, adminIds: ADMIN_IDS, adminUsernames: ADMIN_USERNAMES })

  const { handleBuyRaffleTicket, handleStartNextRaffle } = useRaffleActions({
    tableName: TABLE_NAME, workerUrl: WORKER_URL, isAdmin, raffle, setRaffle,
  })

  const { lastRefreshTime, setLastRefreshTime, markRefreshed } = useRefreshCooldown()
  useHeartbeat({ tableName: TABLE_NAME, getUserId: () => tgUserId.current, locationGranted })
  const { flyingMessages, setFlyingMessages, lastFlyingSendRef } = useFlyingMessages()

  const { filtersUnlocked, setFiltersUnlocked, unlockFilters, filtersUnlockedAt, setFiltersUnlockedAt, filtersExpiry, setFiltersExpiry } = useFilterUnlock({
    isAdmin, workerUrl: WORKER_URL, storageSet: (k: string, v: string) => storage.set(k, v),
    storageKeys: { unlocked: CLOUD.filtersUnlocked, unlockedAt: CLOUD.filtersUnlockedAt },
    saveToDb: async (uid: number, unlocked: boolean, expires: string | null) => { await saveFiltersUnlocked(uid, unlocked, expires) },
    fetchExpiry: async (uid: number) => {
      const status = await fetchUserUnlockStatus(uid)
      return status?.filters_unlocked_expires_at || null
    },
  })

  const { gridRowsUnlocked, setGridRowsUnlocked, unlockRow } = useGridUnlock({
    isAdmin, workerUrl: WORKER_URL, storageSet: (k, v) => storage.set(k, v),
    storageKeys: { rows: CLOUD.gridRowsUnlocked, rowsAt: CLOUD.gridRowsUnlockedAt },
    saveToDb: async (uid, rows) => { await saveGridRowsUnlocked(uid, rows) },
  })

  const { invisibleUntil, isInvisible, hasPurchasedInvisible, toggleInvisible, loadInvisibleState } = useInvisibleMode({
    isAdmin, workerUrl: WORKER_URL, storageSet: (k, v) => storage.set(k, v), storageGet: (k) => storage.get(k),
    storageKey: CLOUD.invisibleActive, updateDb: async (uid, until) => { await updateInvisibleStatus(uid, until) },
  })

  const { adminAction, setAdminAction, promptUnlockProfile, releaseLock } = useProfileUnlock({
    isAdmin, workerUrl: WORKER_URL, storageSet: (k, v) => storage.set(k, v), lockKey: CLOUD.prefLockedAt,
    onPaid: async () => { const uid = tgUserId.current; if (uid) await updateProfileUnlockStatus(uid, true, null) },
  })

  const { channelFollowUnlock, setChannelFollowUnlock, claimChannelFollow } = useChannelFollow({
    channelUrl: CHANNEL_URL, storageSet: (k, v) => storage.set(k, v), storageKey: CLOUD.channelFollowed,
    openLink: (url) => { const tg = getTg(); if (tg?.openTelegramLink) tg.openTelegramLink(url); else if (tg?.openLink) tg.openLink(url, { try_instant_view: false }); else window.open(url, '_blank') },
  })

  const { hideAgeActive, toggleHideAge } = useHideAge({
    isAdmin, workerUrl: WORKER_URL, storageSet: (k, v) => storage.set(k, v), storageKey: CLOUD.hideAge,
    updateDb: async (until) => { await updateHideAgeStatus(tgUserId.current || 0, until) },
  })

  // ── Splash ─────────────────────────────────────────────────────────
  useEffect(() => { splashTimerRef.current = setTimeout(() => setShowSplash(false), 3000); return () => { if (splashTimerRef.current) clearTimeout(splashTimerRef.current) } }, [])
  useEffect(() => { if (videoReady) { const t = setTimeout(() => setShowSplash(false), 1800); return () => clearTimeout(t) } }, [videoReady])

  // ── Group check ────────────────────────────────────────────────────
  useEffect(() => {
    const tg = getTg(); const inTg = isInTelegram(); const user = tg?.initDataUnsafe?.user
    if (isAdminUser(user, ADMIN_IDS, ADMIN_USERNAMES)) { setGroupCheck('member'); return }
    if (!inTg || !tg) { setGroupCheck('not_member'); return }
    setGroupCheck('member')
  }, [])

  // ── Init: load Telegram user + saved data + Supabase sync ──────────
  useEffect(() => {
    (async () => {
      const tg = getTg(); const inTg = isInTelegram()
      if (!inTg) tgUserId.current = 999999

      if (tg) {
        tg.ready(); tg.expand(); tg.setHeaderColor('#0A0A0A')
        const user = tg.initDataUnsafe?.user
        if (user) {
          tgUserId.current = user.id
          setIsPremium(!!user.is_premium)
          setIsAdmin(isAdminUser(user, ADMIN_IDS, ADMIN_USERNAMES))
          // Photo: try initDataUnsafe first, then fallback to worker API
          let photoUrl = user.photo_url || ''
          if (!photoUrl && user.id) {
            try {
              const photoRes = await fetch(`${WORKER_URL.replace('/createinvoice', '')}/getuserphoto?user_id=${user.id}`, { signal: AbortSignal.timeout(5000) })
              if (photoRes.ok) {
                const photoData = await photoRes.json()
                if (photoData.photo_url) photoUrl = photoData.photo_url
              }
            } catch { /* Worker may not have this endpoint — ignore */ }
          }
          setOwnProfile(prev => ({
            ...prev, id: String(user.id), name: user.first_name || prev.name,
            tgUsername: user.username || prev.tgUsername,
            tgPhotoUrl: photoUrl || prev.tgPhotoUrl,
            tgPhotos: photoUrl ? [photoUrl] : prev.tgPhotos,
            hasPhoto: (!!photoUrl && photoUrl.startsWith('http')) || prev.hasPhoto,
            hasRealPhoto: !!photoUrl || prev.hasRealPhoto || false,
            gender: APP_CONFIG.showGender ? (prev.gender) : APP_CONFIG.defaultGender,
            seekingGender: APP_CONFIG.showGender ? (prev.seekingGender) : APP_CONFIG.defaultSeekingGender,
          }))
          if (photoUrl) storage.set(CLOUD.photoUrl, photoUrl)
          if (user.first_name) storage.set(CLOUD.name, user.first_name)
        }
      }

    storage.getAll().then(result => {
      if (!result || Object.keys(result).length === 0) return

      const loaded: Partial<UserProfile> = {}
      if (result[CLOUD.photoUrl]?.trim()) { loaded.tgPhotoUrl = result[CLOUD.photoUrl]; loaded.tgPhotos = [result[CLOUD.photoUrl]] }
      if (result[CLOUD.name]?.trim()) loaded.name = result[CLOUD.name]
      // CRITICAL: Load DOB from local storage (was missing — caused re-entry prompt)
      if (result[CLOUD.dob]?.trim()) { loaded.dob = result[CLOUD.dob]; loaded.age = getAge(result[CLOUD.dob]) }

      const parseNum = (val: string | undefined) => { if (!val?.trim()) return undefined; const n = parseFloat(val); return isNaN(n) ? undefined : n }
      const h = parseNum(result[CLOUD.height]); if (h) loaded.height = h
      const w = parseNum(result[CLOUD.weight]); if (w) loaded.weight = w
      const p = parseNum(result[CLOUD.position]); if (p !== undefined) loaded.position = p
      if (result[CLOUD.isSide] === '1') loaded.isSide = true

      if (result[CLOUD.gender]?.trim()) loaded.gender = result[CLOUD.gender] as 'Male' | 'Female' | 'Non-binary'
      if (result[CLOUD.seeking]?.trim()) loaded.seekingGender = result[CLOUD.seeking] as 'Men' | 'Women' | 'Everyone'

      if (result[CLOUD.pref1]) { const prefs = { ...(loaded.preferences || {}) }; prefs[APP_CONFIG.preferences[0]?.key || 'pref1'] = result[CLOUD.pref1]; loaded.preferences = prefs }
      if (result[CLOUD.pref2]) { const prefs = { ...(loaded.preferences || {}) }; prefs.pref2 = result[CLOUD.pref2]; loaded.preferences = prefs }
      if (result[CLOUD.pref3]) { const prefs = { ...(loaded.preferences || {}) }; prefs.pref3 = result[CLOUD.pref3]; loaded.preferences = prefs }

      loaded.openToMessages = result[CLOUD.openMsg] === 'true'
      if (result[CLOUD.lang]) setLang(result[CLOUD.lang] as Lang)

      // Filter unlock expiry
      const startParam = tg?.initDataUnsafe?.start_param
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
      const unlockedAt = parseInt(result[CLOUD.filtersUnlockedAt] || '0')
      const now = Date.now()
      const expired = unlockedAt > 0 && (now - unlockedAt) > THIRTY_DAYS
      if (!expired && (startParam === 'unlocked' || result[CLOUD.filtersUnlocked] === 'true')) {
        setFiltersUnlocked(true)
        if (startParam === 'unlocked') { storage.set(CLOUD.filtersUnlocked, 'true'); storage.set(CLOUD.filtersUnlockedAt, String(now)); setFiltersUnlockedAt(now) }
        else setFiltersUnlockedAt(unlockedAt)
      } else if (expired) {
        storage.set(CLOUD.filtersUnlocked, ''); storage.set(CLOUD.filtersUnlockedAt, '')
        setFiltersUnlocked(false); setFiltersUnlockedAt(undefined)
      }

      if (result[CLOUD.gridRowsUnlocked]) { const n = parseInt(result[CLOUD.gridRowsUnlocked]); if (!isNaN(n) && n > 0) setGridRowsUnlocked(n) }
      if (result[CLOUD.channelFollowed] === '1') setChannelFollowUnlock(1)

      // Profile unlock check — if profile is incomplete, force edit mode
      const prefLockedAt = result[CLOUD.prefLockedAt]
      if (prefLockedAt) {
        const t = parseInt(prefLockedAt)
        if (!isNaN(t) && t === 0) { setEditProfileUnlocked(true) }
      }

      // Supabase sync
      const syncId = tgUserId.current
      if (syncId) {
        fetchUserUnlockStatus(syncId).then((status: UnlockStatus | null) => {
          if (!status) return
          const now = Date.now()
          const filtersExpired = status.filters_unlocked_expires_at ? new Date(status.filters_unlocked_expires_at).getTime() < now : !status.filters_unlocked
          if (!filtersExpired && status.filters_unlocked) {
            setFiltersUnlocked(true); storage.set(CLOUD.filtersUnlocked, 'true'); storage.set(CLOUD.filtersUnlockedAt, String(now)); setFiltersUnlockedAt(now)
            if (status.filters_unlocked_expires_at) setFiltersExpiry(status.filters_unlocked_expires_at)
          } else if (filtersExpired || !status.filters_unlocked) {
            setFiltersUnlocked(false); storage.set(CLOUD.filtersUnlocked, ''); storage.set(CLOUD.filtersUnlockedAt, ''); setFiltersUnlockedAt(undefined); setFiltersExpiry(null)
          }
          const dbRows = status.grid_rows_unlocked || 0
          if (dbRows >= 0) { setGridRowsUnlocked(dbRows); storage.set(CLOUD.gridRowsUnlocked, String(dbRows)) }
          setOwnProfile(prev => ({ ...prev, hasRealPhoto: !!status.has_real_photo }))
          loadInvisibleState(status.invisible_until)
        }).catch((err: Error) => console.error('sync error:', err))
      }

      // Location
      if (result[CLOUD.lat] && result[CLOUD.lng]) {
        const lat = parseFloat(result[CLOUD.lat]); const lng = parseFloat(result[CLOUD.lng])
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) { loaded.lat = lat; loaded.lng = lng; setLocationGranted(true) }
      }

      // Supabase fallback: if ANY profile field missing from local storage, fetch full profile from DB
      const needsFallback = syncId && (!result[CLOUD.dob]?.trim() || !result[CLOUD.height]?.trim() || !result[CLOUD.weight]?.trim() || !result[CLOUD.photoUrl]?.trim())
      if (needsFallback) {
        fetchUser(syncId).then((dbUser: DbUser | null) => {
          if (!dbUser) return
          const dbLoaded: Partial<UserProfile> = {}
          if (dbUser.dob) { dbLoaded.dob = dbUser.dob; dbLoaded.age = getAge(dbUser.dob) }
          if (dbUser.is_side) dbLoaded.isSide = true
          if (dbUser.height) dbLoaded.height = dbUser.height
          if (dbUser.weight) dbLoaded.weight = dbUser.weight
          if (dbUser.position !== undefined) dbLoaded.position = dbUser.position
          if (dbUser.gender) dbLoaded.gender = dbUser.gender as 'Male' | 'Female' | 'Non-binary'
          if (dbUser.photo_url?.startsWith('http')) {
            dbLoaded.tgPhotoUrl = dbUser.photo_url
            dbLoaded.tgPhotos = [dbUser.photo_url]
            dbLoaded.hasPhoto = true
            dbLoaded.hasRealPhoto = true
          }
          if (dbUser.preference1) { const prefs = { ...(dbLoaded.preferences || {}) }; prefs.safety = dbUser.preference1; dbLoaded.preferences = prefs }
          if (dbUser.preference2) { const prefs = { ...(dbLoaded.preferences || {}) }; prefs.role = dbUser.preference2; dbLoaded.preferences = prefs }
          if (dbUser.preference3) { const prefs = { ...(dbLoaded.preferences || {}) }; prefs.party = dbUser.preference3; dbLoaded.preferences = prefs }
          if (dbUser.preference4) { const prefs = { ...(dbLoaded.preferences || {}) }; prefs.location = dbUser.preference4; dbLoaded.preferences = prefs }
          if (Object.keys(dbLoaded).length > 0) {
            setOwnProfile(prev => {
              const merged = { ...prev, ...dbLoaded }
              if (!APP_CONFIG.showGender) { merged.gender = APP_CONFIG.defaultGender; merged.seekingGender = APP_CONFIG.defaultSeekingGender }
              return merged
            })
          }
        }).catch(() => {})
      }

      if (Object.keys(loaded).length > 0) {
        setOwnProfile(prev => {
          const merged = { ...prev, ...loaded }
          // Force defaults for hidden fields
          if (!APP_CONFIG.showGender) { merged.gender = APP_CONFIG.defaultGender; merged.seekingGender = APP_CONFIG.defaultSeekingGender }
          return merged
        })
      }

      // Mark init complete — profile check effect can now run
      setInitComplete(true)
    })()
  })()
  }, [])

  // ── Check profile completeness on init — open edit if incomplete ────
  // Only runs AFTER storage.getAll() + DB fallback complete (initComplete flag)
  useEffect(() => {
    if (!initComplete) return // Wait for storage load to finish
    setOwnProfile(prev => {
      const complete = isProfileComplete(prev, APP_CONFIG)
      console.log('[ProfileCheck] initComplete=true, profileComplete=', complete, 'dob=', !!prev.dob, 'height=', prev.height, 'weight=', prev.weight)
      if (!complete) {
        setEditProfileUnlocked(true)
        setView('OWN_PROFILE')
      }
      return prev
    })
  }, [initComplete])

  // ── Auto upsert ────────────────────────────────────────────────────
  useEffect(() => {
    const uid = tgUserId.current; const lat = ownProfile.lat; const lng = ownProfile.lng
    if (!uid || !lat || !lng || !hasValidKey) return
    upsertUser({ ...profileToDb(ownProfile), id: uid }).then((result: DbUser | null) => {
      if (result && !result.filters_unlocked_expires_at) ensureFilterUnlock(result.id)
    }).catch((err: Error) => console.error('Upsert error:', String(err).substring(0, 200)))
  }, [ownProfile.lat, ownProfile.lng, ownProfile.name, ownProfile.tgPhotoUrl, ownProfile.height, ownProfile.weight, ownProfile.position, JSON.stringify(ownProfile.preferences), ownProfile.openToMessages, ownProfile.tgUsername, ownProfile.dob, ownProfile.gender, ownProfile.seekingGender])

  // ── Photo detection for extra row: update hasRealPhoto when photo URL appears ──
  useEffect(() => {
    const hasPhoto = !!(ownProfile.tgPhotoUrl && ownProfile.tgPhotoUrl.startsWith('http'))
    if (hasPhoto && !ownProfile.hasRealPhoto) {
      setOwnProfile(prev => ({ ...prev, hasRealPhoto: true }))
    }
  }, [ownProfile.tgPhotoUrl])

  // ── Refresh ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    const lat = ownProfile.lat; const lng = ownProfile.lng
    if (!lat || !lng) return
    setIsLoadingUsers(true)
    fetchNearby(lat, lng).then((dbUsers: DbUser[]) => {
      const myId = tgUserId.current
      const mapped = dbUsers.filter((u: DbUser) => u.id !== myId).map((u: DbUser) => dbToProfile(u, lat, lng))
      setUsers(mapped); setIsLoadingUsers(false)
    }).catch((err: Error) => { console.error('Refresh error:', String(err).substring(0, 200)); setIsLoadingUsers(false) })
  }, [ownProfile.lat, ownProfile.lng])

  useEffect(() => {
    const lat = ownProfile.lat; const lng = ownProfile.lng
    if (!lat || !lng) return
    handleRefresh()
    const interval = setInterval(handleRefresh, 300000)
    return () => clearInterval(interval)
  }, [ownProfile.lat, ownProfile.lng, handleRefresh])

  // ── Location granted ───────────────────────────────────────────────
  const handleLocationGranted = useCallback((lat: number, lng: number) => {
    setLocationGranted(true); setIsLoadingUsers(true)
    setOwnProfile(prev => ({ ...prev, lat, lng }))
    storage.set(CLOUD.lat, String(lat)); storage.set(CLOUD.lng, String(lng))
  }, [])

  // ── Save profile — locks on save, returns to grid only if complete ──
  const handleSaveProfile = useCallback((updated: UserProfile) => {
    // Auto-fill name from Telegram (always, since we removed name field)
    const tg = getTg()
    const telegramName = tg?.initDataUnsafe?.user?.first_name
    if (telegramName) updated.name = telegramName
    // Force defaults for hidden fields
    if (!APP_CONFIG.showGender) { updated.gender = APP_CONFIG.defaultGender; updated.seekingGender = APP_CONFIG.defaultSeekingGender }
    // Sync hideAge with hook state (hook manages purchase/DB directly)
    updated.hideAge = hideAgeActive

    setOwnProfile(updated)

    // Only lock and return to grid if profile is complete
    if (isProfileComplete(updated, APP_CONFIG)) {
      storage.set(CLOUD.prefLockedAt, String(Date.now()))
      setEditProfileUnlocked(false)
      setView('MAIN')
    } else {
      // Keep edit mode open, show what's missing
      const missing = getMissingFields(updated, APP_CONFIG)
      alert(`Profile incomplete. Missing: ${missing.join(', ')}`)
    }

    // Save ALL profile fields to local storage (critical for re-entry persistence)
    storage.set(CLOUD.dob, updated.dob || '')
    storage.set(CLOUD.height, String(updated.height))
    storage.set(CLOUD.weight, String(updated.weight))
    storage.set(CLOUD.position, String(updated.position || 0.5))
    storage.set(CLOUD.isSide, updated.isSide ? '1' : '0')
    if (updated.gender) storage.set(CLOUD.gender, updated.gender)
    if (updated.seekingGender) storage.set(CLOUD.seeking, updated.seekingGender)
    APP_CONFIG.preferences.forEach((cat: PreferenceCategory, idx: number) => {
      const val = updated.preferences[cat.key]
      if (val) storage.set(getPrefStorageKey(idx), val)
    })

    const uid = tgUserId.current
    if (uid && updated.lat && updated.lng) {
      upsertUser({ ...profileToDb(updated), id: uid }).catch((err: Error) => console.error('Profile upsert error:', err))
    }
  }, [hideAgeActive])

  // ── Message handler ────────────────────────────────────────────────
  const handleMessage = useCallback((user: UserProfile) => {
    if (user.openToMessages && !starsPaidFor.has(user.id)) {
      const tg = getTg()
      if (tg?.showPopup) {
        tg.showPopup({ title: '⭐ Send Stars to Chat', message: `${user.name} requires sending Telegram Stars to open chat. Send stars now?`,
          buttons: [{ id: 'pay', type: 'default', text: 'Send ⭐ 50' }, { type: 'cancel', text: 'Cancel' }]
        }, (btnId: string) => { if (btnId === 'pay') { setStarsPaidFor(prev => new Set(prev).add(user.id)); handleMessage(user) } })
      } else { if (confirm(`Send 50 ⭐ to ${user.name} to open chat?`)) { setStarsPaidFor(prev => new Set(prev).add(user.id)); handleMessage(user) } }
      return
    }
    const tgUrl = `https://t.me/${user.tgUsername || 'HKMembersOnly'}`
    const tg = getTg()
    if (tg?.openTelegramLink) { tg.openTelegramLink(tgUrl); return }
    if (tg?.openLink) { tg.openLink(tgUrl, { try_instant_view: false }); return }
    window.open(tgUrl, '_blank')
  }, [starsPaidFor])

  // ═════════════════════════════════════════════════════════════════════
  // RENDER — Views. NO CHANGES NEEDED.
  // ═════════════════════════════════════════════════════════════════════

  if (showSplash) {
    return (
      <div className="min-h-[100vh] bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="w-full max-w-[min(520px,100vw)] flex flex-col items-center justify-center gap-5">
          <video src={logoAnim} autoPlay loop muted playsInline onLoadedData={() => setVideoReady(true)} className="w-48 h-48 rounded-full object-cover" />
          <div className="text-center"><h1 className="text-2xl font-bold gradient-text tracking-tight">MyApp</h1><p className="text-[#8E8E93] text-xs mt-1">Your Dating App</p></div>
          <p className="text-[#8E8E93]/60 text-[9px] text-center leading-relaxed max-w-[320px]">By using this app, you confirm you are 18+.</p>
        </div>
      </div>
    )
  }

  if (groupCheck === 'checking') {
    return (<div className="min-h-[100vh] bg-neutral-950 flex justify-center"><div className="w-full max-w-[min(520px,100vw)] bg-[#0A0A0A] h-[100vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--app-primary)] border-t-transparent rounded-full animate-spin" /></div></div>)
  }

  if (groupCheck === 'not_member') {
    const tg = getTg(); const raw = tg ? JSON.stringify(tg.initDataUnsafe, null, 2) : 'no Telegram WebApp'
    return (
      <div className="min-h-[100vh] bg-neutral-950 flex justify-center">
        <div className="w-full max-w-[min(520px,100vw)] bg-[#0A0A0A] h-[100vh] relative flex flex-col px-6 pt-16 pb-6 overflow-y-auto">
          <div className="flex flex-col items-center text-center flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-[var(--app-primary)]/10 flex items-center justify-center mb-4"><Lock className="w-8 h-8 text-[var(--app-primary)]" /></div>
            <h1 className="text-2xl font-bold text-white mb-2">{t(lang, 'membersOnly')}</h1>
            <p className="text-[#8E8E93] text-sm mb-1">This app is exclusively for members of</p>
            <p className="text-[var(--app-primary)] font-semibold text-sm mb-4">@yourgroup</p>
            <button onClick={() => { const t = getTg(); if (t?.openTelegramLink) t.openTelegramLink(GROUP_CHAT_URL); else window.open(GROUP_CHAT_URL, '_blank') }} className="gradient-btn px-6 py-3 rounded-xl text-white font-semibold text-sm nav-press mb-4">{t(lang, 'openInGroup')}</button>
          </div>
          <div className="mt-4 flex-1 min-h-0 flex flex-col">
            <p className="text-[#8E8E93] text-[10px] text-center mb-2">{t(lang, 'openFromGroup')}</p>
            <details className="text-left"><summary className="text-[#8E8E93] text-[10px] cursor-pointer select-none text-center">{t(lang, 'showDebug')}</summary><pre className="mt-2 p-2 bg-[#1A1A1A] rounded-lg text-[9px] text-[#8E8E93] overflow-auto max-h-48 whitespace-pre-wrap break-all">{raw}</pre></details>
          </div>
        </div>
      </div>
    )
  }

  if (!locationGranted) {
    return (<div className="min-h-[100vh] bg-neutral-950 flex justify-center"><div className="w-full max-w-[min(520px,100vw)] bg-[#0A0A0A] h-[100vh] relative"><LocationGate onGranted={handleLocationGranted} lang={lang} /></div></div>)
  }

  return (
    <TelegramGate>
      <FlyingMessagesOverlay messages={flyingMessages} onDone={(id) => setFlyingMessages(prev => prev.filter(m => m.id !== id))} />
      <div className="min-h-screen bg-neutral-950 flex justify-center">
        <div className="w-full max-w-[min(520px,100vw)] bg-[#0A0A0A] h-screen relative flex flex-col">
          {view === 'MAIN' ? (
            <MainScreen ownProfile={ownProfile} users={users} onViewOwnProfile={() => setView('OWN_PROFILE')} onViewPhoto={(u) => setPhotoOverlay(u)}
              showDbWarning={!hasValidKey} isLoadingUsers={isLoadingUsers} lang={lang} setLang={setLang}
              onRefresh={handleRefresh} isAdmin={isAdmin} filtersUnlocked={isAdmin || filtersUnlocked}
              onPromptUnlock={unlockRow} onPromptFilterUnlock={unlockFilters}
              onToggleInvisible={() => { toggleInvisible().catch(() => {}); handleRefresh() }} gridRowsUnlocked={gridRowsUnlocked}
              channelFollowUnlock={channelFollowUnlock} onClaimChannelFollow={claimChannelFollow}
              lastRefreshTime={lastRefreshTime} setLastRefreshTime={(t) => { setLastRefreshTime(t); markRefreshed() }}
              isInvisible={isInvisible} invisiblePurchased={hasPurchasedInvisible}
              raffle={raffle} onBuyRaffleTicket={handleBuyRaffleTicket} onStartNextRaffle={handleStartNextRaffle}
              onPromptUnlockProfile={promptUnlockProfile} isPremium={isPremium} />
          ) : (
            <ProfileView user={ownProfile} lang={lang} logoUrl={logoImg} appConfig={APP_CONFIG}
              onSave={handleSaveProfile} onBack={() => { if (isProfileComplete(ownProfile, APP_CONFIG)) setView('MAIN') }} editProfileUnlocked={isAdmin || editProfileUnlocked}
              hideAgeActive={hideAgeActive} onToggleHideAge={toggleHideAge} />
          )}
          {photoOverlay && (
            <ProfileView user={photoOverlay} lang={lang} logoUrl={logoImg} appConfig={APP_CONFIG}
              onClose={() => setPhotoOverlay(null)} onMessage={handleMessage} ownProfile={ownProfile} />
          )}
          {adminAction === 'release' && (
            <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center" onClick={() => setAdminAction(null)}>
              <div className="bg-[#1C1C1E] rounded-xl p-5 w-64 space-y-3" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-base font-bold text-white text-center">🔓 Release Profile Lock</h3>
                <p className="text-xs text-[#8E8E93] text-center">Release your own 30-day preference lock:</p>
                <button onClick={releaseLock} className="w-full py-2.5 rounded-lg bg-[#2C2C2E] text-white text-sm font-bold nav-press">Release My Lock</button>
                <button onClick={() => setAdminAction(null)} className="w-full py-1.5 text-[10px] text-[#8E8E93]">Cancel</button>
              </div>
            </div>
          )}
          {view === 'MAIN' && (
            <BottomNav lang={lang} cooldownRemaining={Math.max(0, 60000 - (Date.now() - lastFlyingSendRef.current))}
              onSend={(text) => {
                if (Date.now() - lastFlyingSendRef.current < 60000) return
                lastFlyingSendRef.current = Date.now()
                const top = 10 + Math.random() * 80
                const prefixed = `@${ownProfile.tgUsername || ownProfile.name || 'User'} said: ${text}`
                setFlyingMessages(prev => [...prev, { id: Date.now(), text: prefixed, top: `${top}vh` }])
                insertFlyingMessage({ text, username: ownProfile.tgUsername || ownProfile.name || 'User', user_id: tgUserId.current || 0, top_percent: Math.round(top) })
              }}
              groupChatUrl={GROUP_CHAT_URL} referShareUrl="https://t.me/share/url?url=https://t.me/HKMO_D_Bot?startapp&text=Check%20out%20MyApp%20dating%20app" />
          )}
          <UnlockTipCycle lang={lang} isPremium={isPremium} gridRowsUnlocked={gridRowsUnlocked} channelFollowUnlock={channelFollowUnlock} onClaimChannelFollow={claimChannelFollow} />
        </div>
      </div>
    </TelegramGate>
  )
}
