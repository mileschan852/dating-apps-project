import React, { useState, useEffect, useRef } from 'react'
import { useTelegramPhoto } from '@dating/core'

// ─── Types ───────────────────────────────────────────────────────────

export interface GridUser {
  id: string
  name: string
  tgPhotoUrl?: string
  isInvisible?: boolean
  isOnline?: boolean
  updatedAt?: string
  distance: number
  openToMessages?: boolean
  age?: number
  height: number
  weight: number
  dob?: string | null
  hasPhoto?: boolean
  gender?: string
  seekingGender?: string
  position?: number
  preferences?: Record<string, string>
  tgUsername?: string
  [key: string]: any
}

export interface ProfileGridProps {
  users: GridUser[]
  ownProfile: GridUser
  unlockedSlots: number
  totalRealUsers: number
  hasMoreUsers: boolean
  onPromptUnlock: () => void
  onViewOwnProfile: () => void
  onViewPhoto: (user: any) => void
  isAdmin: boolean
  isLoading: boolean
  renderTileBottom: (user: GridUser) => React.ReactNode
  renderTileLabel?: (user: GridUser) => string
  renderTileTopLeft?: (user: GridUser) => React.ReactNode
  tileClassName?: string
  matchingIds?: Set<string>
  logoUrl?: string
}

// ─── Self Tile — uses Telegram photo hook (only called once) ─────────

function SelfGridTile({
  user,
  onClick,
  renderBottom,
  renderTopLeft,
  tileClassName,
}: {
  user: GridUser
  onClick?: () => void
  renderBottom: (user: GridUser) => React.ReactNode
  renderTopLeft?: (user: GridUser) => React.ReactNode
  tileClassName?: string
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const tgPhoto = useTelegramPhoto()
  const photo = tgPhoto || user.tgPhotoUrl || ''
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setImgLoaded(false)
    setImgFailed(false)
    const img = imgRef.current
    if (img && img.complete) {
      if (img.naturalWidth > 0) setImgLoaded(true)
      else setImgFailed(true)
    }
  }, [photo])

  return (
    <button
      onClick={onClick}
      className={`card-enter tile-aspect w-full h-full rounded-lg overflow-hidden nav-press text-left relative ${tileClassName || ''}`}
      style={{ minHeight: '68px' }}
    >
      {photo && !imgFailed && (
        <img
          ref={imgRef}
          src={photo}
          alt={user.tgUsername || user.name}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover z-10 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.3s' }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
          loading="eager"
          draggable={false}
        />
      )}
      {(!photo || !imgLoaded) && !imgFailed && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] flex items-center justify-center z-20">
          <span className="text-lg font-bold text-[#8E8E93]">{(user.tgUsername || user.name).charAt(0)}</span>
        </div>
      )}
      {imgFailed && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] flex items-center justify-center z-20 px-1">
          <span className="text-[8px] font-medium text-[#8E8E93] text-center break-words w-full leading-tight">@{user.tgUsername || user.name}</span>
        </div>
      )}
      <div className="absolute inset-0 profile-photo-gradient pointer-events-none z-20" />
      {/* Invisible overlay — darkens own tile when invisible mode is on */}
      {user.isInvisible && (
        <div className="absolute inset-0 bg-black/40 z-25 pointer-events-none" />
      )}
      {/* ── Top-right badge stack (top to bottom): dot → star → eye ── */}
      <div className="absolute top-0.5 right-0.5 z-30 flex flex-col items-center gap-0.5">
        {/* Green dot — always on for self (you are always online when using the app) */}
        <div className="w-2 h-2 bg-[#00D4AA] rounded-full online-pulse" title="Online" />
        {/* Star — Telegram charges for messages */}
        {user.chargesForMessages && (
          <div className="w-3 h-3 flex items-center justify-center text-[7px] leading-none" title="Charges for messages">⭐</div>
        )}
        {/* Eye — invisible mode on (always shown on self tile) */}
        {user.isInvisible && (
          <div className="w-3 h-3 flex items-center justify-center text-[7px] leading-none" title="Invisible mode on">👁️</div>
        )}
      </div>
      {renderTopLeft?.(user)}
      <div className="absolute bottom-0 left-0 right-0 px-[3px] pb-[1px] pointer-events-none z-30 flex flex-col justify-end">
        <p className="font-semibold text-[8px] leading-tight truncate text-white">
          @{user.tgUsername || user.name}
        </p>
        {renderBottom(user)}
      </div>
    </button>
  )
}

// ─── Other User Tile — uses stored tgPhotoUrl, no hook ───────────────

function GridTile({
  user,
  onClick,
  renderBottom,
  renderTopLeft,
  tileClassName,
  logoUrl: _logoUrl,
  isAdmin,
}: {
  user: GridUser
  onClick?: () => void
  renderBottom: (user: GridUser) => React.ReactNode
  renderTopLeft?: (user: GridUser) => React.ReactNode
  tileClassName?: string
  logoUrl?: string
  isAdmin?: boolean
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const photo = user.tgPhotoUrl || ''
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setImgLoaded(false)
    setImgFailed(false)
    const img = imgRef.current
    if (img && img.complete) {
      if (img.naturalWidth > 0) setImgLoaded(true)
      else setImgFailed(true)
    }
  }, [photo])

  const ONLINE_THRESHOLD_MS = 15 * 60 * 1000
  const isActive = user.updatedAt
    ? Date.now() - new Date(user.updatedAt).getTime() < ONLINE_THRESHOLD_MS
    : false

  return (
    <button
      onClick={onClick}
      className={`card-enter tile-aspect w-full h-full rounded-lg overflow-hidden nav-press text-left relative ${tileClassName || ''}`}
      style={{ minHeight: '68px' }}
    >
      {photo && !imgFailed && (
        <img
          ref={imgRef}
          src={photo}
          alt={user.tgUsername || user.name}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover z-10 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.3s' }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
          loading="eager"
          draggable={false}
        />
      )}
      {(!photo || !imgLoaded) && !imgFailed && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] flex items-center justify-center z-20">
          <span className="text-lg font-bold text-[#8E8E93]">{(user.tgUsername || user.name).charAt(0)}</span>
        </div>
      )}
      {imgFailed && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] flex items-center justify-center z-20 px-1">
          <span className="text-[8px] font-medium text-[#8E8E93] text-center break-words w-full leading-tight">@{user.tgUsername || user.name}</span>
        </div>
      )}
      <div className="absolute inset-0 profile-photo-gradient pointer-events-none z-20" />
      {/* Invisible overlay — darkens profile photo for invisible users (admin sees it dimmed) */}
      {user.isInvisible && (
        <div className="absolute inset-0 bg-black/40 z-25 pointer-events-none" />
      )}
      {/* ── Top-right badge stack (top to bottom): dot → star → eye ── */}
      <div className="absolute top-0.5 right-0.5 z-30 flex flex-col items-center gap-0.5">
        {/* Green dot — shown when user was active within 15 min */}
        {isActive && (
          <div className="w-2 h-2 bg-[#00D4AA] rounded-full online-pulse" title="Online" />
        )}
        {/* Star — Telegram charges for messages */}
        {user.chargesForMessages && (
          <div className="w-3 h-3 flex items-center justify-center text-[7px] leading-none" title="Charges for messages">⭐</div>
        )}
        {/* Eye — invisible mode; only visible to admin for other users */}
        {user.isInvisible && isAdmin && (
          <div className="w-3 h-3 flex items-center justify-center text-[7px] leading-none" title="Invisible user">👁️</div>
        )}
      </div>
      {renderTopLeft?.(user)}
      <div className="absolute bottom-0 left-0 right-0 px-[3px] pb-[1px] pointer-events-none z-30 flex flex-col justify-end">
        <p className="font-semibold text-[8px] leading-tight truncate text-white">
          @{user.tgUsername || user.name}
        </p>
        {renderBottom(user)}
      </div>
    </button>
  )
}

// ─── Divider bar between self card and nearby users ───────────────────

function NearbyDivider() {
  return (
    <div className="col-span-5 flex items-center gap-2 py-1 my-0.5">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#3A3A3C] to-transparent" />
      <span className="text-[9px] text-[#48484A] font-medium tracking-widest uppercase flex-shrink-0">
        Nearby
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#3A3A3C] to-transparent" />
    </div>
  )
}

// ─── Profile Grid ────────────────────────────────────────────────────

export function ProfileGrid({
  users,
  ownProfile,
  unlockedSlots,
  totalRealUsers,
  hasMoreUsers: _hasMoreUsers,
  onPromptUnlock,
  onViewOwnProfile,
  onViewPhoto,
  isAdmin,
  isLoading,
  renderTileBottom,
  renderTileTopLeft,
  tileClassName,
  matchingIds,
  logoUrl,
}: ProfileGridProps) {
  if (isLoading && users.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-[#5AC8FA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-[#8E8E93] text-xs">Loading...</p>
      </div>
    )
  }

  // ── Build display list ──────────────────────────────────────────────
  // Self is always slot 0. Other users follow in distance order (App.tsx sorts).
  // Grid ALWAYS shows exactly 100 tiles — padded with blank silhouettes.
  const TOTAL_SLOTS = 100
  const otherUsers = users.filter((u) => u.id !== ownProfile.id)
  const realUsers: GridUser[] = [ownProfile, ...otherUsers]
  const displayUsers: GridUser[] = [...realUsers]
  while (displayUsers.length < TOTAL_SLOTS) {
    displayUsers.push({
      id: `blank_${displayUsers.length}`,
      name: '',
      distance: 0,
      age: 0,
      height: 0,
      weight: 0,
      isBlank: true,
    } as GridUser)
  }

  // ── Split at the dividing bar ────────────────────────────────────────
  // barPosition = (2 + bonusRows) × 5, capped at 100.
  // Tiles at index < barPosition: clickable (above bar).
  // Tiles at index >= barPosition: greyed-out silhouettes (below bar).
  const barPosition = Math.min(Math.max(unlockedSlots, 1), TOTAL_SLOTS)
  const unlockedTiles = displayUsers.slice(0, barPosition)
  const lockedTiles = displayUsers.slice(barPosition)
  const hiddenRealCount = lockedTiles.filter((u) => !(u as any).isBlank).length

  let nearbyDividerInserted = false

  return (
    <div className="grid grid-cols-5 gap-1.5">

      {/* ── UNLOCKED AREA (above dividing bar) ─────────────────────── */}
      {unlockedTiles.map((user, idx) => {
        const isBlank = !!(user as any).isBlank

        // Blank slot in unlocked area — empty placeholder
        if (isBlank) {
          return (
            <div
              key={user.id}
              className="relative aspect-square rounded-lg bg-[#2C2C2E]/60 border border-[#3A3A3C]/40 flex items-center justify-center"
              style={{ pointerEvents: 'none' }}
            >
              <svg className="w-4 h-4 text-[#48484A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          )
        }

        // Self tile — always at index 0, always unlocked
        if (idx === 0) {
          return (
            <div
              key={user.id}
              className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200"
              style={{ borderColor: '#5AC8FA' }}
            >
              <SelfGridTile
                user={user}
                onClick={onViewOwnProfile}
                renderBottom={renderTileBottom}
                renderTopLeft={renderTileTopLeft}
                tileClassName={tileClassName}
              />
            </div>
          )
        }

        // Insert "Nearby" divider before the first other-user tile in the unlocked area
        const showDivider = !nearbyDividerInserted
        if (showDivider) nearbyDividerInserted = true

        // Dim non-matching users (preference filter) but keep them clickable
        const dim = matchingIds && !matchingIds.has(user.id) ? 0.35 : 1

        return (
          <React.Fragment key={user.id}>
            {showDivider && <NearbyDivider />}
            <div
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent transition-all duration-200"
              style={{ opacity: dim }}
            >
              <GridTile
                user={user}
                onClick={() => onViewPhoto(user)}
                renderBottom={renderTileBottom}
                renderTopLeft={renderTileTopLeft}
                tileClassName={tileClassName}
                logoUrl={logoUrl}
                isAdmin={isAdmin}
              />
            </div>
          </React.Fragment>
        )
      })}

      {/* ── DIVIDING BAR ────────────────────────────────────────────── */}
      {/* Always shown when there are locked tiles below.               */}
      {/* Tapping it calls onPromptUnlock (show unlock options).        */}
      {lockedTiles.length > 0 && (
        <div
          className="col-span-full flex items-center gap-2 py-2 my-0.5 cursor-pointer select-none active:opacity-70 transition-opacity"
          onClick={onPromptUnlock}
          role="button"
          aria-label="Unlock more profiles"
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#5AC8FA]/40 to-transparent" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5AC8FA]/10 border border-[#5AC8FA]/30">
            <span className="text-[10px]">🔒</span>
            <span className="text-[10px] text-[#5AC8FA] font-semibold">
              {hiddenRealCount > 0
                ? (isAdmin ? `Unlock row (admin) · ${hiddenRealCount} hidden` : `Unlock more · ${hiddenRealCount} hidden`)
                : (isAdmin ? 'Unlock row (admin)' : 'Unlock more profiles')
              }
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#5AC8FA]/40 to-transparent" />
        </div>
      )}

      {/* ── LOCKED AREA (below dividing bar) ────────────────────────── */}
      {/* Always rendered — greyed-out, not clickable.                  */}
      {/* Real users show their photo at 25% opacity + lock icon.       */}
      {/* Blank slots show a lock icon silhouette.                      */}
      {lockedTiles.map((user) => {
        const isBlank = !!(user as any).isBlank

        if (isBlank) {
          return (
            <div
              key={user.id}
              className="relative aspect-square rounded-lg bg-[#1C1C1E] border border-[#2C2C2E]/60 flex items-center justify-center"
              style={{ pointerEvents: 'none' }}
            >
              <svg className="w-4 h-4 text-[#3A3A3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          )
        }

        return (
          <div
            key={user.id}
            className="relative aspect-square rounded-lg overflow-hidden border border-[#2C2C2E]/40"
            style={{ pointerEvents: 'none', opacity: 0.25 }}
          >
            <GridTile
              user={user}
              renderBottom={renderTileBottom}
              renderTopLeft={renderTileTopLeft}
              tileClassName={tileClassName}
              logoUrl={logoUrl}
              isAdmin={isAdmin}
            />
            <div className="absolute inset-0 flex items-end justify-center pb-1 z-40">
              <span className="text-[10px]">🔒</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
