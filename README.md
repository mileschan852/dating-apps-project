# Dating Apps Project

A monorepo containing shared packages for building Telegram Mini App dating bots. Two live apps are built from this core: **HKMOD** (gay men, Hong Kong) and **LMN** (straight + lesbian).

---

## Architecture Overview

```
dating-apps-project/          (this monorepo)
│
├── packages/@dating/core/    → Shared logic: hooks, types, i18n, Supabase client
│   ├── src/hooks.ts          → 11 React hooks for purchasing, timers, sync
│   ├── src/supabase.ts       → REST client for all DB operations
│   ├── src/i18n.ts           → i18n engine with 4 languages
│   ├── src/types.ts          → TypeScript types (UserProfile, etc.)
│   ├── src/utils.ts          → Distance, zodiac, role labels, filters
│   ├── src/storage.ts        → Telegram CloudStorage + localStorage
│   ├── src/telegram.ts       → Telegram WebApp helpers
│   └── src/payments.ts       → Stars payment via Cloudflare Worker
│
├── packages/@dating/ui/      → Shared React components
│   ├── src/ProfileGrid.tsx   → User grid with unlock slots
│   ├── src/ProfileView.tsx   → Profile view / edit screen
│   ├── src/BottomNav.tsx     → Bottom nav bar
│   ├── src/TopBar.tsx        → Top bar with raffle + controls
│   ├── src/StatsBar.tsx      → Stats + tip rotation
│   ├── src/FilterButton.tsx  → Filter button + toggle button
│   ├── src/LocationGate.tsx  → Location permission screen
│   └── ...
│
└── app-base/                 → Template for new dating apps
    ├── src/App.tsx           → Minimal working example
    ├── src/lib/i18n.ts       → App-specific translations
    ├── src/lib/supabase.ts   → Table-bound DB client
    └── .github/workflows/
        └── deploy.yml         → Deploys to GitHub Pages
```

**Each app lives in its own repo** (HKMOD, LMN). They copy the `app-base` template and customize it. All shared code comes from `@dating/core` and `@dating/ui` packages.

### Why This Structure?

- **Core is shared**: Bug fixes, new features, security patches → update one place, all apps benefit
- **Apps are independent**: Each app has its own repo, deploys independently, versions independently
- **Template is forkable**: New apps start from `app-base` — change filters, branding, fields

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm (`npm install -g pnpm`)

### Install

```bash
git clone https://github.com/mileschan852/dating-apps-project.git
cd dating-apps-project
pnpm install
```

### Run the template

```bash
pnpm dev:base
```

This starts the `app-base` template on `http://localhost:3002`.

### Build packages

```bash
pnpm build
```

---

## Creating a New Dating App

### Step 1: Copy the Template

```bash
cp -r app-base/ ../my-dating-app
cd ../my-dating-app
git init
git remote add origin https://github.com/YOURNAME/my-dating-app.git
```

### Step 2: Configure 3 Things

| File | What to Change | Example |
|------|---------------|---------|
| `package.json` | App name | `"name": "my-dating-app"` |
| `vite.config.ts` | GitHub Pages base URL | `base: '/my-dating-app/'` |
| `src/lib/supabase.ts` | DB table name | `const TABLE = 'myapp_users'` |

### Step 3: Customize Your App

#### Branding

In `src/App.tsx`:
- Replace `logo.svg` with your logo
- Change `appName` prop on `TopBar`
- Set your primary color in `src/App.css` (`--app-primary`)
- Update `src/lib/i18n.ts` with your app's translations

#### Profile Fields

In `src/lib/supabase.ts`, extend `DbUser` with your fields:

```typescript
export interface DbUser {
  // ... existing fields ...
  my_custom_field?: string
  another_field?: number
}
```

In `src/App.tsx`, extend `UserProfile`:

```typescript
interface UserProfile {
  // ... existing fields ...
  myCustomField?: string
}
```

#### Filters

Add your filter buttons in the filter bar section:

```tsx
<FilterButton
  active={myFilter !== 'All'}
  onClick={cycleMyFilter}
  colorClass={myFilter === 'OptionA' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}
>
  {myFilter}
</FilterButton>
```

### Step 4: Set Up GitHub Pages

1. Go to repo Settings → Pages → Source: GitHub Actions
2. No other config needed — `.github/workflows/deploy.yml` handles everything

### Step 5: Deploy

```bash
git add -A
git commit -m "Initial app"
git push -u origin main
```

GitHub Action builds and deploys to `https://YOURNAME.github.io/my-dating-app/`

### Step 6: Connect Telegram Bot

In [@BotFather](https://t.me/BotFather):
- Create a bot → get token
- Set Menu Button → Web App URL → `https://YOURNAME.github.io/my-dating-app/`

---

## The 11 Hooks from @dating/core

These are the building blocks of every dating app. Import them:

```tsx
import {
  useAdminRecheck, useRaffleActions, useRefreshCooldown,
  useHeartbeat, useFlyingMessages,
  useFilterUnlock, useGridUnlock, useInvisibleMode,
  useProfileUnlock, useChannelFollow, usePhotoInit,
} from '@dating/core'
```

| Hook | What It Does | You Provide | It Handles |
|------|-------------|-------------|-----------|
| `useAdminRecheck` | Periodic admin re-check | `adminIds`, `adminUsernames` | Runs interval, calls `setIsAdmin` |
| `useRaffleActions` | Raffle ticket purchase + draw | `tableName`, `workerUrl` | Invoice → Stars → DB update |
| `useRefreshCooldown` | 5-min grid refresh timer | Nothing | `canRefresh`, countdown display |
| `useHeartbeat` | Online ping every 30s | `tableName`, `userId` | Calls `setOnlineStatus` |
| `useFlyingMessages` | Floating message ticker | Nothing | Polling, dedup, cleanup |
| `useFilterUnlock` | 30-day filter unlock | `workerUrl`, `storageKeys` | Invoice → unlock → expiry |
| `useGridUnlock` | Grid row unlock | `workerUrl`, `storageKeys` | Invoice → more rows |
| `useInvisibleMode` | Invisible mode toggle | `workerUrl`, `storageKey` | Purchase → hide from grid |
| `useProfileUnlock` | Release 30-day profile lock | `lockKey` | Admin check → release |
| `useChannelFollow` | Channel follow unlock | `channelUrl` | Open TG → verify → +1 row |
| `usePhotoInit` | Get Telegram photo on start | Nothing | Extracts photo_url from WebApp |

**Every purchasing hook follows the same pattern**: check admin → create invoice → Stars payment → update DB → update state. You never write `fetch()` for payments.

---

## Shared UI Components

Import from `@dating/ui`:

```tsx
import {
  TopBar, StatsBar, ProfileGrid, ProfileView,
  BottomNav, LocationGate, FlyingMessagesOverlay,
  FilterButton, ToggleButton,
} from '@dating/ui'
```

| Component | Props | Notes |
|-----------|-------|-------|
| `TopBar` | `logo`, `appName`, `raffle`, `isAdmin`, `onBuyRaffleTicket`, `onStartNextRaffle`, `onToggleInvisible`, `onPromptUnlockProfile`, `onRefresh`, `lang`, `langLabel`, `onCycleLang` | Raffle button only shows when `raffle` is non-null |
| `StatsBar` | `lang`, `isPremium`, `gridRowsUnlocked`, `channelFollowUnlock`, `hasRealPhoto`, `appVersion`, `children` | Pass `<UnlockTipCycle />` as children |
| `ProfileGrid` | `users`, `ownProfile`, `unlockedSlots`, `totalRealUsers`, `hasMoreUsers`, `onPromptUnlock`, `onViewOwnProfile`, `onViewPhoto`, `isAdmin`, `isLoading`, `matchingIds`, `logoUrl`, `renderTileBottom` | Renders 5-column grid. Own profile always slot 1 |
| `ProfileView` | `user`, `lang`, `logoUrl`, `onSave`, `onBack`, `editProfileUnlocked`, `onClose`, `onMessage`, `ownProfile` | Edit mode when `editProfileUnlocked` is true |
| `BottomNav` | `lang`, `cooldownRemaining`, `onSend`, `groupChatUrl`, `referShareUrl`, `walletUrl` | Wallet opens `t.me/wallet` directly |
| `LocationGate` | `onGranted`, `lang` | Requests browser geolocation |
| `FlyingMessagesOverlay` | `messages`, `onDone` | Floating text ticker |
| `FilterButton` | `active`, `onClick`, `colorClass`, `locked`, `children` | Shows colour even when locked (with 🔒) |
| `ToggleButton` | `active`, `onClick`, `children` | Gradient when active, muted when off |

---

## File Structure of a New App

After copying `app-base`, your app looks like this:

```
my-dating-app/
├── .github/workflows/deploy.yml    ← GitHub Pages deploy (no changes needed)
├── index.html                      ← Telegram WebApp script, no-cache headers
├── vite.config.ts                  ← Add base: '/my-dating-app/'
├── tailwind.config.js              ← Add your src paths
├── tsconfig.json                   ← Extends @dating/config/tsconfig
├── package.json                    ← Your app name
├── src/
│   ├── main.tsx                    ← React entry (no changes needed)
│   ├── App.tsx                     ← YOUR APP — customize this
│   ├── App.css                     ← Your brand colours, animations
│   ├── index.css                   ← Tailwind + dating-core styles
│   ├── lib/
│   │   ├── i18n.ts                 ← Your translations
│   │   └── supabase.ts             ← DB table name + schema
│   └── assets/
│       └── logo.svg                ← Your logo
```

**Only these files need customization:**
- `package.json` — app name
- `vite.config.ts` — GitHub Pages base URL
- `src/App.tsx` — your app logic, filters, branding
- `src/App.css` — brand colours
- `src/lib/i18n.ts` — your translations
- `src/lib/supabase.ts` — table name + extra fields
- `src/assets/logo.svg` — your logo

---

## Environment Variables

Set these in your GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Required | Purpose |
|--------|----------|---------|
| `SUPABASE_ANON_KEY` | Yes | Your Supabase project anon key |

The Supabase URL is baked into the shared packages. The anon key must match your Supabase project.

---

## Publishing Package Updates

When you update `@dating/core` or `@dating/ui`:

```bash
# 1. Bump version in package.json
cd packages/@dating/core
# edit version in package.json

# 2. Build
cd ../../..
pnpm build

# 3. Publish (requires npm auth)
pnpm publish -r --filter=@dating/* --access public
```

Apps update by running `npm update @dating/core @dating/ui` in their repos.

---

## Troubleshooting

**Build fails with "Cannot find module '@dating/core'"**
→ Make sure `@dating/core` and `@dating/ui` are in your `package.json` dependencies, or copy the source into `src/dating-core/` and `src/dating-ui/` with Vite aliases.

**Blank grey screen after splash**
→ Check browser console. Most likely a missing import or a hook error. The `main.tsx` has error handlers that show errors on screen.

**Purchasing buttons don't work**
→ Every purchasing hook needs a `workerUrl` pointing to your Cloudflare Worker. Set this in your `WORKER_URL` constant in `App.tsx`.

**Users don't show on grid**
→ Check `hasValidKey` — your `SUPABASE_ANON_KEY` must be set in GitHub secrets.

---

## License

Private — packages are free to use by forks of this project.
