# @dating/ui

Shared React UI components for dating apps. Import and use — zero customization needed.

## Components

### TopBar

Top navigation bar with app logo, raffle status, invisible toggle, refresh button, language switcher.

```tsx
import { TopBar } from '@dating/ui'

<TopBar
  logo={<img src={logoImg} className="w-8 h-8 rounded-full" />}
  appName="MyApp"
  raffle={raffle}              // Raffle | null — shows raffle button when active
  isAdmin={isAdmin}            // boolean — shows admin raffle controls
  onBuyRaffleTicket={buy}      // () => void — opens Stars invoice
  onStartNextRaffle={start}    // () => void — admin starts next raffle
  onToggleInvisible={toggle}   // () => void — toggles invisible mode
  onPromptUnlockProfile={unlock}  // () => void — releases profile lock
  onRefresh={refresh}          // () => void — refreshes user grid
  lastRefreshTime={timestamp}  // number — for cooldown display
  lang={lang}                  // Lang
  langLabel="EN"               // string — displayed language code
  onCycleLang={() => {}}       // () => void — cycles language
/>
```

### StatsBar

Displays app version, grid stats, premium status, and tips.

```tsx
import { StatsBar } from '@dating/ui'

<StatsBar
  lang={lang}
  isPremium={isPremium}                    // boolean
  gridRowsUnlocked={gridRowsUnlocked}      // number
  channelFollowUnlock={channelFollowUnlock} // number
  hasRealPhoto={hasRealPhoto}              // boolean | undefined
  appVersion="1.0"                         // string — displayed after core version
>
  <YourUnlockTipCycle />  {/* Pass tip rotation as children */}
</StatsBar>
```

Version format: `v{CORE_VERSION}.{appVersion}.{BUILD_VERSION}` → `v18.1.47`

### ProfileGrid

5-column user grid with unlock slot gating. Own profile always in slot 1.

```tsx
import { ProfileGrid } from '@dating/ui'

<ProfileGrid
  users={users}                    // UserProfile[] (without own profile)
  ownProfile={ownProfile}          // UserProfile with isOwn: true
  unlockedSlots={effectiveRows * 5} // number — how many slots to show
  totalRealUsers={users.length}    // number
  hasMoreUsers={users.length > slots} // boolean
  onPromptUnlock={unlock}          // () => void — when user taps locked slot
  onViewOwnProfile={() => {}}      // () => void — tap own profile tile
  onViewPhoto={(user) => {}}       // (user) => void — tap other user's photo
  isAdmin={isAdmin}                // boolean
  isLoading={isLoading}            // boolean
  matchingIds={matchingSet}        // Set<string> — which users match filters
  logoUrl={logoImg}                // string — shown in empty slots
  renderTileBottom={(user) => (    // (user) => ReactNode — bottom of each tile
    <div>{formatDist(user.distance)}</div>
  )}
/>
```

**Online dot**: Self always shows green. Other users show green only if updated within 15 minutes.

### ProfileView

Profile display and edit screen.

```tsx
import { ProfileView } from '@dating/ui'

// View mode (tap other user's photo)
<ProfileView
  user={selectedUser}
  lang={lang}
  logoUrl={logoImg}
  onClose={() => setSelected(null)}   // closes overlay
  onMessage={(user) => openChat(user)} // opens Telegram chat
  ownProfile={ownProfile}              // for comparison/context
/>

// Edit mode (own profile)
<ProfileView
  user={ownProfile}
  lang={lang}
  logoUrl={logoImg}
  onSave={(updated) => save(updated)}  // saves and locks profile
  onBack={() => setView('MAIN')}       // returns to grid
  editProfileUnlocked={true}           // allows editing
/>
```

When `editProfileUnlocked` is true and `onSave` is provided, shows edit form. Saving calls `onSave` then locks the profile for 30 days.

### BottomNav

Bottom navigation with message input, group chat, share, and wallet buttons.

```tsx
import { BottomNav } from '@dating/ui'

<BottomNav
  lang={lang}
  cooldownRemaining={60000}   // ms — flying message cooldown
  onSend={(text) => send(text)}  // (text) => void — sends flying message
  groupChatUrl="https://t.me/yourgroup"   // group chat link
  referShareUrl="https://t.me/share/url?..."  // share link
  walletUrl="https://t.me/wallet"         // wallet deep link
/>
```

**Wallet button** opens `t.me/wallet` directly via `openTelegramLink`.

### LocationGate

Requests browser geolocation before showing the app.

```tsx
import { LocationGate } from '@dating/ui'

{!location ? (
  <LocationGate
    onGranted={(lat, lng) => setLocation({ lat, lng })}
    lang={lang}
  />
) : (
  <MainApp />
)}
```

### FlyingMessagesOverlay

Floating message ticker across the top of the screen.

```tsx
import { FlyingMessagesOverlay } from '@dating/ui'

<FlyingMessagesOverlay
  messages={flyingMessages}        // { id, text, top }[]
  onDone={(id) => remove(id)}     // removes message when animation ends
/>
```

### FilterButton

Consistent filter/toggle button. Shows colour even when locked.

```tsx
import { FilterButton } from '@dating/ui'

// Active filter with colour
<FilterButton
  active={true}
  onClick={cycleFilter}
  colorClass="bg-blue-500/20 text-blue-400 border-blue-500/30"
>
  Male
</FilterButton>

// Locked filter (shows colour with lock icon)
<FilterButton
  active={true}
  onClick={promptUnlock}  // opens purchase dialog
  colorClass="bg-blue-500/20 text-blue-400"
  locked={true}
>
  Role
</FilterButton>
```

### ToggleButton

Two-state button with gradient when active.

```tsx
import { ToggleButton } from '@dating/ui'

<ToggleButton
  active={onlineOnly}
  onClick={() => setOnlineOnly(!onlineOnly)}
>
  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1" />
  Online
</ToggleButton>
```

## Styling

All components use Tailwind CSS classes. Import the shared styles in your `index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@import 'dating-core/styles.css';
```

Set your brand color in `App.css`:

```css
:root {
  --app-primary: #FF6B35;  /* HKMOD orange */
  /* --app-primary: #00D4AA;  /* LMN teal */
}
```

## Dependencies

- `react` ^18.0.0
- `react-dom` ^18.0.0
- `lucide-react` ^0.460.0
- `@dating/core` (peer dependency)
