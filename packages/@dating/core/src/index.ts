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
  setTelegramUserId,
  useAdminRecheck,
  useRaffleActions,
  useRefreshCooldown,
  useNearbyRefresh,
  useHeartbeat,
  useFlyingMessages,
  useGridUsers,
  usePaymentPrompt,
  useFilterUnlock,
  useGridUnlock,
  useInvisibleMode,
  useProfileUnlock,
  useChannelFollow,
  useSyncUnlockStatus,
  useHideAge,
  useProfileSave,
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
  type UseProfileSaveOptions,
  type FlyingMessageItem,
} from './hooks'

// ─── Telegram / Storage ──────────────────────────────────────────────
export { getTg, isInTelegram, getUserId, getTgUser, supportsPayments, extractTgUser, setCachedUserId, getCachedUserId, setCachedTgUser, getCachedTgUser, createStorage } from './storage'
export { useTelegramPhoto } from './useTelegramPhoto'
export { createCloudKeys } from './cloudKeys'

// ─── i18n ────────────────────────────────────────────────────────────
export { t, getLangLabel, mergeDict, getDefaultLang } from './i18n'
export { createAppT, type AppTResult } from './i18nFactory'

// ─── Supabase ────────────────────────────────────────────────────────
export {
  hasValidKey,
  logPurchase,
  upsertUser, fetchUser, fetchNearby, setOnlineStatus, deleteUser, clearAllUsers,
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
  isUserActive, isRecentlyActive, isProfileComplete, getMissingFields,
  detectRealPhoto,
  dbToProfile, profileToDb,
  getPreferenceLabel, getPreferenceOptionLabel, getPreferenceColour,
  cycleLang,
} from './utils'

// ─── Payments ────────────────────────────────────────────────────────
export { requestPayment, openInvoice } from './payments'
