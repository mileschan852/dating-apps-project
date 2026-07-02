// ─── Dating App Shell Hook ───────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react'
import { createStorage, type StorageConfig } from './storage'
import { getTg, getUserId } from './telegram'
import { setGridRowsUnlocked as apiSetGridRows, setFiltersUnlocked as apiSetFilters, updateInvisibleStatus } from './supabase'
import type { UserProfile } from './types'
import type { Raffle } from './supabase'
import type { Lang } from './i18n'
import { getDefaultLang } from './i18n'
import {
  useRefreshCooldown,
  useNearbyRefresh,
  useHeartbeat,
  useFlyingMessages,
  useGridUnlock,
  useFilters,
  useInvisibleMode,
  useAdminRecheck,
  usePurchase,
  useChannelFollow,
  usePhotoInit,
  useProfileUnlock,
  useRaffleActions,
  useSyncUnlockStatus,
  useFilterUnlock,
  useGridUsers,
  useGridFilters,
  useHideAge,
  usePaymentPrompt,
} from './hooks'
import { fetchAllUsers, fetchUserById, upsertUser, setOnlineStatus, insertFlyingMessage, fetchFlyingMessages } from './supabase'
import { dbToProfile, haversineKm, setUserLocation, isAdminUser } from './utils'
import { getLangLabel } from './i18n'

export interface AppShellConfig {
  appName: string
  appVersion: string
  adminUsernames: string[]
  defaultPrefFilters: Record<string, string>
  prefFilterFn: (user: UserProfile, filters: Record<string, string>) => boolean
  groupChatUrl: string
  referShareUrl: string
  officialChatLabel: string
  logoUrl?: string
}

export function useAppShell(config: AppShellConfig) {
  const {
    appName,
    appVersion,
    adminUsernames,
    defaultPrefFilters,
    prefFilterFn,
    groupChatUrl,
    referShareUrl,
    officialChatLabel,
    logoUrl,
  } = config

  // ─── Core State ───────────────────────────────────────────────────
  const [lang, setLang] = useState<Lang>(getDefaultLang())
  const [view, setView] = useState<'grid' | 'profile'>('grid')
  const [ownProfile, setOwnProfile] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now())
  const [locationResolved, setLocationResolved] = useState(false)

  // ─── Hooks ────────────────────────────────────────────────────────
  const storage = createStorage({ prefix: appName })
  const tg = getTg()
  const userId = getUserId()

  const { cooldownRemaining, startCooldown } = useRefreshCooldown(storage)
  const { refreshNearby } = useNearbyRefresh()
  const { heartbeat } = useHeartbeat(appName)
  const { flyingMessages, handleSend } = useFlyingMessages(userId, ownProfile?.name)
  const { gridRowsUnlocked, setGridRowsUnlocked } = useGridUnlock(userId)
  const { filters, setOnlineOnly, setHasPicOnly } = useFilters(storage)
  const { isInvisible, setIsInvisible, invisiblePurchased } = useInvisibleMode(userId)
  const { isAdmin, recheckAdmin } = useAdminRecheck(userId, adminUsernames)
  const { isPremium, handlePurchase } = usePurchase(userId)
  const { joinedOfficialChat, checkChannelFollow } = useChannelFollow(userId)
  const { hasTelegramPhoto } = usePhotoInit(userId)
  const { profileUnlocked, setProfileUnlocked } = useProfileUnlock(userId)
  const { activeRaffle, buyTicket, startRaffle, drawWinner } = useRaffleActions(userId)
  const { syncStatus } = useSyncUnlockStatus(userId)
  const { filtersUnlocked, setFiltersUnlocked } = useFilterUnlock(userId)
  const { gridUsers, loadMoreUsers } = useGridUsers(users, gridRowsUnlocked)
  const { matchingIds } = useGridFilters(users, filters, prefFilterFn, defaultPrefFilters)
  const { hideAgeActive, setHideAgeActive } = useHideAge(userId)
  const { showPaymentPrompt } = usePaymentPrompt()

  // ─── Actions ──────────────────────────────────────────────────────
  const cycleLang = useCallback(() => {
    setLang(prev => prev === 'en' ? 'zh' : 'en')
  }, [])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    const data = await fetchAllUsers(appName)
    setUsers(data.map(dbToProfile))
    setUsersLoading(false)
    setLastRefreshTime(Date.now())
  }, [appName])

  const handleSaveProfile = useCallback(async (p: UserProfile) => {
    const success = await upsertUser(appName, p)
    if (success) {
      setOwnProfile(p)
      setView('grid')
    }
  }, [appName])

  // ─── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (tg) {
      tg.ready()
      tg.expand()
    }
    loadUsers()
  }, [tg, loadUsers])

  return {
    lang, view, setView, ownProfile, setOwnProfile,
    users, usersLoading, lastRefreshTime, locationResolved, setLocationResolved,
    cooldownRemaining, startCooldown, refreshNearby, heartbeat,
    flyingMessages, handleSend, gridRowsUnlocked, setGridRowsUnlocked,
    filters, setOnlineOnly, setHasPicOnly, isInvisible, setIsInvisible,
    invisiblePurchased, isAdmin, recheckAdmin, isPremium, handlePurchase,
    joinedOfficialChat, checkChannelFollow, hasTelegramPhoto, profileUnlocked,
    setProfileUnlocked, activeRaffle, buyTicket, startRaffle, drawWinner,
    syncStatus, filtersUnlocked, setFiltersUnlocked, gridUsers, loadMoreUsers,
    matchingIds, hideAgeActive, setHideAgeActive, showPaymentPrompt,
    cycleLang, loadUsers, handleSaveProfile,
    appName, appVersion, groupChatUrl, referShareUrl, officialChatLabel, logoUrl,
  }
}
