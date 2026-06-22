# Code Audit: What's Duplicated Between HKMOD and LMN

## Identical Code (should be in app-base template)

### 1. All 11 Hooks Setup (lines ~595-659)
- `useAdminRecheck` — identical params
- `useRaffleActions` — identical params
- `useRefreshCooldown` — identical
- `useHeartbeat` — identical params
- `useFlyingMessages` — identical
- `useFilterUnlock` — identical params
- `useGridUnlock` — identical params
- `useInvisibleMode` — identical params
- `useProfileUnlock` — identical params
- `useChannelFollow` — identical params

### 2. Splash Screen (lines ~661-671)
- Same dual-effect pattern (max timeout + video ready)
- Only content differs (logo, text)

### 3. Group Membership Check (lines ~673-684)
- Identical logic: admin bypass → inTelegram check

### 4. Init Effect — Load Telegram User (lines ~686-713)
- Same: `tg.ready()`, `tg.expand()`, extract user, set admin/premium
- Same: `storage.set(CLOUD.photoUrl, photoUrl)`

### 5. Init Effect — Load Saved Data (lines ~715-838)
- Same pattern: storage.getAll() → parse fields → set state
- Same: filter unlock expiry check (30 days)
- Same: grid rows restore
- Same: channel follow restore
- Same: profile unlock check (prefLockedAt === 0 → open edit)
- Same: Supabase sync (fetchUserUnlockStatus → update all states)
- Same: location restore
- **Only difference**: which preference keys map to which profile fields

### 6. Auto Upsert Effect (lines ~841-866)
- Identical pattern: check uid + lat/lng + hasValidKey → upsertUser
- Same: ensureFilterUnlock on first upsert

### 7. Refresh Handler (lines ~868-884)
- Identical: fetchNearby → dbToProfile → filter own → setUsers

### 8. Refresh Interval (lines ~886-893)
- Identical: handleRefresh() + 5min interval

### 9. Location Granted Handler (lines ~895-902)
- Identical

### 10. Save Profile Handler (lines ~904-930)
- Same: setOwnProfile → lock profile (prefLockedAt = Date.now()) → setView('MAIN') → upsertUser

### 11. Render — All View States
- Splash screen view
- Group check spinner view
- Group not_member view (only URLs differ)
- Location gate view
- Main app layout (FlyingMessagesOverlay + container)
- View switcher (MAIN vs OWN_PROFILE)
- Photo overlay view
- Admin unlock modal
- BottomNav with flying messages

### 12. Utility Functions
- `UnlockTipCycle` component — same structure, different tip text
- `isRecentlyActive` — identical (15min threshold)
- `ONLINE_THRESHOLD_MS` constant
- Loading spinner JSX
- Online/offline legend

### 13. Types & Constants
- `type View = 'MAIN' | 'OWN_PROFILE'`
- Storage setup: `createCloudKeys()` + `createStorage()`
- State declarations (all useState calls)
- Refs (tgUserId, splashTimerRef, lastFlyingSendRef)

---

## App-Specific Code (stays in each app)

### 1. Admin Config
- ADMIN_IDS, ADMIN_USERNAMES (different per app)
- WORKER_URL (different per app)
- GROUP_CHAT_URL, CHANNEL_URL (different per app)
- TABLE_NAME (different per app)

### 2. Profile Fields
- `UserProfile` interface (app-specific fields)
- `dbToProfile()` function (maps DB fields to profile)

### 3. Filters
- Filter state declarations
- Filter button JSX
- Filter logic in the grid filter

### 4. Branding
- Logo import
- App name
- Colour scheme (--app-primary)
- Tip text content

### 5. Tile Rendering
- `renderTileBottom` (different info per app)

### 6. Message Handler
- Slight variations (Just Browsing check in LMN)
- Different fallback Telegram username

---

## Recommendation

The app-base template should be a **complete working app** (~900 lines) where the only things you customize are:

1. **Admin config** (5 constants at top)
2. **UserProfile + dbToProfile** (your fields)
3. **Filter buttons + filter logic** (your filters)
4. **Branding** (logo, name, CSS, tip text)
5. **renderTileBottom** (what shows under each grid tile)

Everything else (hooks, effects, views, handlers) comes from the template.
