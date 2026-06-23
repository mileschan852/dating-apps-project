// dating-core — barrel exports for ALL dating apps

// ─── Types ───────────────────────────────────────────────────────────
export type { Lang } from './i18n'
export type {
  UserProfile,
  PreferenceCategory,
  PreferenceOption,
  FeatureConfig,
  PaymentItem,
  AppConfig,
} from './types'
export { UNLOCKABLE_FEATURES, ONE_OFF_PURCHASES } from './types'

// ─── Hooks ───────────────────────────────────────────────────────────
export {
  useAdminRecheck,
  useRaffleActions,
  useRefreshCooldown,
  useHeartbeat,
  useFlyingMessages,
  useFilterUnlock,
  useGridUnlock,
  useInvisibleMode,
  useProfileUnlock,
  useChannelFollow,
  useSyncUnlockStatus,
  useHideAge,
  type UseAdminRecheckOptions,
  type UseRaffleActionsOptions,
  type UseRefreshCooldownOptions,
  type UseHeartbeatOptions,
  type UseFlyingMessagesOptions,
  type UseFilterUnlockOptions,
  type UseGridUnlockOptions,
  type UseInvisibleModeOptions,
  type UseProfileUnlockOptions,
  type UseChannelFollowOptions,
  type UseSyncUnlockStatusOptions,
  type UseHideAgeOptions,
  type FlyingMessageItem,
} from './hooks'

// ─── Telegram / Storage ──────────────────────────────────────────────
export { getTg, isInTelegram, getUserId, getTgUser, supportsPayments, createStorage } from './storage'
export { createCloudKeys } from './cloudKeys'

// ─── i18n ────────────────────────────────────────────────────────────
export { t, getLangLabel, mergeDict, getDefaultLang } from './i18n'
export { createAppT, type AppTResult } from './i18nFactory'

// ─── Supabase ────────────────────────────────────────────────────────
export {
  hasValidKey,
  upsertUser, fetchNearby, setOnlineStatus, deleteUser, clearAllUsers,
  fetchUserUnlockStatus, updateInvisibleStatus, updateHideAgeStatus, updateProfileUnlockStatus,
  updateRealPhotoStatus, fetchUserPhotoStatus,
  setGridRowsUnlocked, setFiltersUnlocked,
  ensureFilterUnlock, relockUserFeatures,
  getActiveRaffle, createRaffle, buyRaffleTicket,
  startRaffleCountdown, drawRaffleWinner, completeRaffle,
  getRaffleTickets, setRaffleDrawToNextWednesday,
  insertFlyingMessage, fetchFlyingMessages,
  checkRealPhoto, checkPhotoGate,
  createSupabaseClient,
} from './supabase'

export type { DbUser, Raffle, UnlockStatus, FlyingMessage } from './supabase'

// ─── Utils ───────────────────────────────────────────────────────────
export {
  isAdminUser,
  getTimeAgo, getDistance, formatDist,
  getZodiac, getZodiacEmoji, getAge,
  isUserActive, isProfileComplete, getMissingFields,
  detectRealPhoto,
  dbToProfile, profileToDb,
  getPreferenceLabel, getPreferenceOptionLabel, getPreferenceColour,
} from './utils'

// ─── Payments ────────────────────────────────────────────────────────
export { requestPayment, openInvoice } from './payments'
