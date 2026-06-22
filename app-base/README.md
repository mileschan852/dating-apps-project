# App Base — Dating App Template

A minimal working dating app built on `@dating/core` and `@dating/ui`. Fork this to create your own dating app.

**What this template gives you:**
- User grid with 5-column layout
- Location-based discovery
- Online/offline indicators
- Profile view/edit
- Language switching (EN/TC/SC/RU)
- Flying messages
- Bottom navigation
- Stars payments via Telegram
- Raffle system
- Invisible mode
- GitHub Pages deployment

**What you customize:**
- App name, logo, brand colours
- Profile fields (e.g., gender, role, preferences)
- Filters (what users can filter by)
- Translations
- DB table name

---

## 5 Steps to Your Own Dating App

### Step 1: Copy This Template

```bash
cp -r app-base/ ../my-dating-app
cd ../my-dating-app
rm -rf .git  # remove template git history
git init
git remote add origin https://github.com/YOURNAME/my-dating-app.git
```

### Step 2: Configure These 3 Files

#### `package.json` — App name

```json
{
  "name": "my-dating-app",
  "version": "1.0.0"
}
```

#### `vite.config.ts` — GitHub Pages URL

```typescript
export default defineConfig({
  base: '/my-dating-app/',  // Must match your repo name
  // ...
})
```

Your app will be at: `https://YOURNAME.github.io/my-dating-app/`

#### `src/lib/supabase.ts` — Database table

```typescript
const TABLE = 'myapp_users'  // Your Supabase table name
```

Also extend `DbUser` with your custom fields:

```typescript
export interface DbUser {
  // ... existing fields ...
  my_custom_field?: string
}
```

### Step 3: Customize Your App

#### A. Branding (`src/App.tsx` + `src/App.css`)

```tsx
// Replace logo
import logoImg from './assets/my-logo.svg'

// Set app name
<TopBar appName="MyApp" logo={<img src={logoImg} />} />
```

```css
/* src/App.css */
:root {
  --app-primary: #FF6B35;  /* Your brand colour */
}
```

#### B. Profile Fields (`src/App.tsx`)

Add fields to your `UserProfile` interface:

```typescript
interface UserProfile {
  // ... existing fields ...
  gender?: 'Male' | 'Female' | 'Non-binary'
  lookingFor?: 'Men' | 'Women' | 'Everyone'
}
```

#### C. Filters

Add filter buttons in the filter bar:

```tsx
// State
const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All')

// Filter button
<FilterButton
  active={genderFilter !== 'All'}
  onClick={() => cycleGenderFilter()}
  colorClass={genderFilter === 'Male' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}
>
  {genderFilter}
</FilterButton>

// Filter logic in ProfileGrid
const filteredUsers = allUsers.filter(u => {
  if (genderFilter !== 'All' && u.gender !== genderFilter) return false
  // ... other filters ...
  return true
})
```

#### D. Translations (`src/lib/i18n.ts`)

```typescript
const APP: Record<Lang, Record<string, string>> = {
  en: {
    appTitle: 'My Dating App',
    myCustomLabel: 'Custom Label',
  },
  tc: {
    appTitle: '我的交友程式',
    myCustomLabel: '自定義標籤',
  },
  // ... sc, ru ...
}
```

### Step 4: Set Up GitHub Pages

1. Push to GitHub:
```bash
git add -A
git commit -m "Initial app"
git push -u origin main
```

2. Go to your repo on GitHub → Settings → Pages
3. Source: GitHub Actions
4. The `.github/workflows/deploy.yml` in this template handles the rest

### Step 5: Connect Your Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → name it
2. Set Menu Button → Web App URL → `https://YOURNAME.github.io/my-dating-app/`
3. Done! Users tap the menu button to open your app

---

## File-by-File Guide

### `src/App.tsx` — Your Main App

This is where all your app logic lives. The template provides:

- **State management**: `useState` for profile, users, filters, etc.
- **Shared hooks**: All 11 hooks from `@dating/core` imported and used
- **Handlers**: `onRefresh`, `onSaveProfile`, `handleMessage`, etc.
- **Render**: Conditional views (splash → group check → location → main grid)

**Sections you customize:**
- Filter bar (add/remove filter buttons)
- `dbToProfile()` mapping (convert DB row to app profile)
- `UserProfile` interface (add your fields)
- `handleMessage()` (custom message logic)

### `src/lib/supabase.ts` — Database Client

Thin wrapper around `@dating/core` supabase functions. **Only changes:**
- `TABLE` constant — your Supabase table name
- `DbUser` interface — your schema fields
- Type re-exports (`Raffle`, `UnlockStatus`)

### `src/lib/i18n.ts` — Translations

Merge the core i18n with your app-specific translations:

```typescript
import { t as baseT, type Lang } from '@dating/core'

const APP = {
  en: { yourKey: 'Your Text' },
  tc: { yourKey: '你的文字' },
  // ...
}

export function t(lang: Lang, key: string): string {
  return APP[lang]?.[key] || baseT(lang, key)  // Fallback to core
}
```

### `src/App.css` — Styles

Set your brand colour and any custom animations:

```css
:root {
  --app-primary: #FF6B35;
}

.gradient-btn {
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C61 100%);
}
```

### `.github/workflows/deploy.yml` — Deployment

No changes needed. This deploys to GitHub Pages on every push to `main`.

---

## Understanding the Hooks

This template demonstrates how to use all 11 hooks from `@dating/core`:

```tsx
// 1. Admin re-check every 30s
useAdminRecheck({ isAdmin, setIsAdmin, adminIds, adminUsernames })

// 2. Raffle (buy ticket, draw winner)
const { handleBuyRaffleTicket, handleStartNextRaffle } = useRaffleActions({
  tableName, workerUrl, isAdmin, raffle, setRaffle
})

// 3. 5-min refresh cooldown
const { lastRefreshTime, canRefresh } = useRefreshCooldown()

// 4. Online heartbeat every 30s
useHeartbeat({ tableName, getUserId, locationGranted })

// 5. Flying messages polling
const { flyingMessages, setFlyingMessages } = useFlyingMessages()

// 6. Filter unlock (30 days via Stars)
const { filtersUnlocked, unlockFilters } = useFilterUnlock({
  isAdmin, workerUrl, storageSet, storageKeys, saveToDb
})

// 7. Grid row unlock (via Stars)
const { gridRowsUnlocked, unlockRow } = useGridUnlock({
  isAdmin, workerUrl, storageSet, storageKeys, saveToDb
})

// 8. Invisible mode (hide from grid)
const { isInvisible, toggleInvisible } = useInvisibleMode({
  isAdmin, workerUrl, storageSet, storageGet, storageKey, updateDb
})

// 9. Profile lock release (admin)
const { promptUnlockProfile, releaseLock } = useProfileUnlock({
  isAdmin, workerUrl, storageSet, lockKey
})

// 10. Channel follow (+1 row)
const { channelFollowUnlock, claimChannelFollow } = useChannelFollow({
  channelUrl, storageSet, storageKey, openLink
})

// 11. Telegram photo init
const { photoUrl, hasPhoto } = usePhotoInit()
```

Every purchasing hook handles: **admin check → create invoice → Stars payment → DB update → state update**. You never write `fetch()` for payments.

---

## Common Customizations

### Add a New Filter

```tsx
// 1. Add state
const [heightFilter, setHeightFilter] = useState<'All' | 'Tall' | 'Short'>('All')

// 2. Add button
<FilterButton
  active={heightFilter !== 'All'}
  onClick={cycleHeightFilter}
  colorClass="bg-purple-500/20 text-purple-400"
>
  {heightFilter}
</FilterButton>

// 3. Add to filter logic
if (heightFilter === 'Tall' && u.height < 175) return false
if (heightFilter === 'Short' && u.height > 170) return false
```

### Change Profile Fields

```tsx
// In UserProfile interface
interface UserProfile {
  // ... existing ...
  zodiac?: string        // Add zodiac sign
  languages?: string[]   // Add spoken languages
}

// In dbToProfile() helper
return {
  // ... existing ...
  zodiac: getZodiac(u.dob),
  languages: u.languages?.split(',') || [],
}
```

### Add a New Screen

```tsx
type View = 'MAIN' | 'OWN_PROFILE' | 'SETTINGS'  // Add SETTINGS

// Render
{view === 'SETTINGS' && <SettingsScreen onBack={() => setView('MAIN')} />}
```

---

## Troubleshooting

**Grey screen / nothing loads**
→ Check browser console. `main.tsx` has error handlers that show JS errors on screen.

**"Cannot find module '@dating/core'"**
→ Make sure `@dating/core` and `@dating/ui` are in `package.json`. For standalone repos without the monorepo, copy `packages/@dating/core/src/` to `src/dating-core/` and `packages/@dating/ui/src/` to `src/dating-ui/`, then add aliases in `vite.config.ts`.

**Users don't appear on grid**
→ Check `hasValidKey` — your `SUPABASE_ANON_KEY` secret must be set in GitHub repo settings.

**Purchasing buttons don't work**
→ Every hook needs a `workerUrl` pointing to your Cloudflare Worker. Set `WORKER_URL` in `App.tsx`.

**Build fails on GitHub Actions**
→ Check the Actions tab for error logs. Common: missing type imports, unused variables, or `erasableSyntaxOnly` in tsconfig.

---

## Next Steps

1. Fork this template
2. Customize filters and profile fields
3. Set your brand colour and logo
4. Add your translations
5. Push to GitHub and connect your bot

See the main [dating-apps-project README](https://github.com/mileschan852/dating-apps-project) for the full architecture overview.
