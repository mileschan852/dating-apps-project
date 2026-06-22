# @dating/core

Shared core library for dating apps. Everything your app needs except UI components.

## What's Inside

| Module | Exports | Purpose |
|--------|---------|---------|
| `hooks` | 11 React hooks | Purchasing, timers, sync, raffle |
| `supabase` | All DB functions | REST client for user/unlock/raffle ops |
| `i18n` | `t()`, `getLangLabel()` | 4-language translation engine |
| `storage` | `createStorage()`, `getTg()` | Telegram CloudStorage + localStorage |
| `telegram` | `getTg()`, `isInTelegram()` | Telegram WebApp helpers |
| `types` | `UserProfile`, `FilterConfig` | TypeScript types |
| `utils` | `formatDist()`, `getZodiac()`, `dbToProfile()` | Formatting, distance, zodiac |
| `payments` | `requestPayment()`, `openInvoice()` | Stars payment helpers |
| `cloudKeys` | `createCloudKeys()` | Telegram CloudStorage key factory |
| `flyingMessages` | `insertFlyingMessage()` | Floating message ticker |

## Import Everything

```tsx
import {
  // Hooks
  useAdminRecheck, useRaffleActions, useRefreshCooldown,
  useHeartbeat, useFlyingMessages, useFilterUnlock,
  useGridUnlock, useInvisibleMode, useProfileUnlock,
  useChannelFollow, usePhotoInit,
  // Telegram / Storage
  getTg, isInTelegram, createStorage, createCloudKeys,
  // i18n
  t, getLangLabel, getDefaultLang,
  // Supabase
  upsertUser, fetchNearby, fetchUserUnlockStatus,
  updateInvisibleStatus, setGridRowsUnlocked, setFiltersUnlocked,
  getActiveRaffle, buyRaffleTicket, insertFlyingMessage,
  // Utils
  formatDist, getTimeAgo, isAdminUser, dbToProfile,
  // Types
  type UserProfile, type Lang, type Raffle, type DbUser,
} from '@dating/core'
```

## The 11 Hooks

Every hook follows the same pattern: you provide config options, the hook returns state + actions.

### useAdminRecheck

Periodically re-checks if the current user is an admin.

```tsx
const [isAdmin, setIsAdmin] = useState(false)

useAdminRecheck({
  isAdmin,           // current admin state
  setIsAdmin,        // setter
  adminIds: [123],   // Telegram user IDs who are admins
  adminUsernames: ['admin1'], // Telegram usernames who are admins
})
```

### useRaffleActions

Handles raffle ticket purchase, countdown start, winner draw, and completion.

```tsx
const [raffle, setRaffle] = useState<Raffle | null>(null)

const { handleBuyRaffleTicket, handleStartNextRaffle } = useRaffleActions({
  tableName: 'users',
  workerUrl: 'https://your-worker.workers.dev/createinvoice',
  isAdmin,
  raffle,
  setRaffle,
})
```

Returns:
- `handleBuyRaffleTicket()` — opens Stars invoice for ticket
- `handleStartNextRaffle()` — admin only: starts countdown

### useRefreshCooldown

Manages the 5-minute cooldown between grid refreshes.

```tsx
const { lastRefreshTime, setLastRefreshTime, canRefresh, remainingFormatted, markRefreshed } = useRefreshCooldown()
```

Returns:
- `lastRefreshTime` — timestamp of last refresh
- `canRefresh` — boolean, true if 5min passed
- `remainingFormatted` — human-readable countdown string

### useHeartbeat

Pings the server every 30 seconds to mark user as online.

```tsx
useHeartbeat({
  tableName: 'users',
  getUserId: () => tgUserId.current, // function returning current user ID
  locationGranted: true, // only runs when location is granted
})
```

### useFlyingMessages

Polls for floating messages and manages the display queue.

```tsx
const { flyingMessages, setFlyingMessages, lastFlyingSendRef } = useFlyingMessages()
```

### useFilterUnlock

30-day filter unlock via Stars payment.

```tsx
const { filtersUnlocked, setFiltersUnlocked, unlockFilters, filtersUnlockedAt } = useFilterUnlock({
  isAdmin,
  workerUrl: 'https://your-worker.workers.dev/createinvoice',
  storageSet: (k, v) => storage.set(k, v), // function to save to storage
  storageKeys: { unlocked: 'filters_unlocked', unlockedAt: 'filters_unlocked_at' },
  saveToDb: async (uid, unlocked, expires) => { await saveFiltersUnlocked(uid, unlocked, expires) },
})
```

### useGridUnlock

Unlock additional grid rows via Stars payment.

```tsx
const { gridRowsUnlocked, setGridRowsUnlocked, unlockRow } = useGridUnlock({
  isAdmin,
  workerUrl: 'https://your-worker.workers.dev/createinvoice',
  storageSet: (k, v) => storage.set(k, v),
  storageKeys: { rows: 'grid_rows_unlocked', rowsAt: 'grid_rows_unlocked_at' },
  saveToDb: async (uid, rows) => { await saveGridRowsUnlocked(uid, rows) },
})
```

### useInvisibleMode

Toggle invisible mode (hide from grid) via Stars purchase.

```tsx
const { invisibleUntil, isInvisible, hasPurchasedInvisible, toggleInvisible, loadInvisibleState } = useInvisibleMode({
  isAdmin,
  workerUrl: 'https://your-worker.workers.dev/createinvoice',
  storageSet: (k, v) => storage.set(k, v),
  storageGet: (k) => storage.get(k), // returns Promise<string>
  storageKey: 'invisible_active',
  updateDb: async (uid, until) => { await updateInvisibleStatus(uid, until) },
})
```

### useProfileUnlock

Release the 30-day profile edit lock. Admin can release any user's lock.

```tsx
const { adminAction, setAdminAction, promptUnlockProfile, releaseLock } = useProfileUnlock({
  isAdmin,
  workerUrl: 'https://your-worker.workers.dev/createinvoice',
  storageSet: (k, v) => storage.set(k, v),
  lockKey: 'pref_locked_at',
})
```

### useChannelFollow

Unlock +1 grid row by joining the Telegram channel.

```tsx
const { channelFollowUnlock, setChannelFollowUnlock, claimChannelFollow } = useChannelFollow({
  channelUrl: 'https://t.me/yourchannel',
  storageSet: (k, v) => storage.set(k, v),
  storageKey: 'channel_followed',
  openLink: (url) => { getTg()?.openTelegramLink(url) },
})
```

### usePhotoInit

Extracts the user's profile photo from Telegram WebApp on startup.

```tsx
const { photoUrl, hasPhoto } = usePhotoInit()
```

Returns:
- `photoUrl` — the Telegram profile photo URL
- `hasPhoto` — boolean, true if photo exists

## Supabase Functions

All functions are table-agnostic — pass `TABLE` as first argument.

### User Operations

```typescript
upsertUser(TABLE, user)        // Insert or update user
fetchNearby(TABLE, lat, lng)   // Fetch users near location
setOnlineStatus(TABLE, id, isOnline)  // Mark user online/offline
deleteUser(TABLE, id)          // Delete user
clearAllUsers(TABLE)           // Delete ALL users (admin)
```

### Unlock / Status

```typescript
fetchUserUnlockStatus(TABLE, userId)  // Get user's unlock status
updateInvisibleStatus(TABLE, userId, until)  // Set invisible until date
setGridRowsUnlocked(TABLE, userId, rows)     // Set unlocked row count
setFiltersUnlocked(TABLE, userId, unlocked, expiresAt)  // Set filter unlock
ensureFilterUnlock(TABLE, userId)     // Auto-grant 7-day filter unlock
relockUserFeatures(TABLE, userId)     // Reset all unlocks
```

### Raffles

```typescript
getActiveRaffle()                    // Get current active raffle
createRaffle(name, price, countdownMinutes)  // Create new raffle
buyRaffleTicket(raffleId, userId)    // Purchase ticket
startRaffleCountdown(raffleId)       // Start countdown
drawRaffleWinner(raffleId)           // Draw winner
completeRaffle(raffleId, winnerId)   // Mark complete
```

### Flying Messages

```typescript
insertFlyingMessage(userId, username, text)  // Post flying message
fetchFlyingMessages(since)             // Get messages since timestamp
```

## i18n

Built-in languages: `en` (English), `tc` (Traditional Chinese), `sc` (Simplified Chinese), `ru` (Russian).

```typescript
import { t, getLangLabel, getDefaultLang, mergeDict } from '@dating/core'

// Core translations
t('en', 'membersOnly')   // "Members Only"
t('tc', 'online')        // "在線"

// Language labels
getLangLabel('en')       // "EN"

// Default based on browser/Telegram
getDefaultLang()         // "en" | "tc" | "sc" | "ru"

// Merge with app-specific translations
const myAppT = mergeDict(coreDict, appDict)
```

## Storage

Telegram CloudStorage with localStorage fallback.

```typescript
import { createStorage, createCloudKeys } from '@dating/core'

// Create a namespaced storage client
const storage = createStorage({ prefix: 'myapp' })

// Define your CloudStorage keys
const CLOUD = createCloudKeys('myapp')
// CLOUD.name = 'myapp_name'
// CLOUD.photoUrl = 'myapp_photo_url'
// CLOUD.lat = 'myapp_lat'
// etc. (see cloudKeys.ts for full list)

// Usage
await storage.set(CLOUD.name, 'John')
const name = await storage.get(CLOUD.name)
const all = await storage.getAll()  // Returns Record<string, string>
```

## Utils

```typescript
import { formatDist, getTimeAgo, getDistance, getZodiac, isAdminUser } from '@dating/core'

formatDist(1200)        // "1.2 km"
getTimeAgo('2024-01-01')  // "2 days ago"
getDistance(lat1, lng1, lat2, lng2)  // distance in meters
getZodiac('1990-03-15')  // "Pisces"
isAdminUser(user, [123], ['admin'])  // true/false
```

## Types

```typescript
import type { UserProfile, Lang, Raffle, DbUser, UnlockStatus } from '@dating/core'

interface UserProfile {
  id: string
  name: string
  age: number
  height: number
  weight: number
  position: number       // 0=Bottom, 0.5=Versatile, 1=Top
  isSide: boolean
  isOnline: boolean
  distance: number
  lat?: number
  lng?: number
  isOwn?: boolean
  preference1?: 'Safe' | 'Raw'
  preference2?: 'Clean' | 'Party' | 'Party✓'
  preference3?: '1on1' | 'Group'
  preference4?: 'Host' | 'Travel' | 'Outdoor' | 'Sauna'
  openToMessages?: boolean
  tgUsername?: string
  tgPhotoUrl?: string
  tgPhotos?: string[]
  updatedAt?: string
  hasPhoto: boolean
  hasRealPhoto?: boolean
  isInvisible: boolean
  invisibleUntil?: string
}
```

## Version

Version is tracked in `package.json`. Bump when adding features or fixing bugs that apps depend on.
