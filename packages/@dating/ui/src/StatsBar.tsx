import React, { useState, useEffect } from 'react'
import { type Lang } from '@dating/core'

export const CORE_VERSION = '18'
declare const __APP_VERSION__: string
const BUILD_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

export interface StatsBarProps {
  lang: Lang
  appVersion: string

  // Unlock factors — each maps to one criterion in the right-side ticker
  isPremium: boolean
  hasTelegramPhoto?: boolean
  hasRealPhoto?: boolean
  joinedOfficialChat?: boolean
  purchasedExtraRows?: number
  activeBoosts?: number

  // Total rows already computed by useGridUnlock — shown on the left
  gridRowsUnlocked: number

  // App-specific label for the official chat (e.g. "@HKMembersOnlyChat")
  officialChatLabel?: string

  // Badge legend — show/hide the dot + star legend row
  showBadgeLegend?: boolean

  // Legacy / optional
  channelFollowUnlock?: number
  children?: React.ReactNode
  invisibleUnlocked?: boolean
  filtersUnlocked?: boolean
  hideAgeUnlocked?: boolean
  profileLocked?: boolean
  onPromptUnlockProfile?: () => void
}

// ─── Criterion type ───────────────────────────────────────────────────
interface Criterion {
  label: string
  unlocked: boolean
  detail?: string
}

function buildCriteria(props: StatsBarProps): Criterion[] {
  const {
    hasTelegramPhoto = false,
    isPremium = false,
    joinedOfficialChat = false,
    purchasedExtraRows = 0,
    activeBoosts = 0,
    hasRealPhoto = false,
    officialChatLabel = '@chat',
  } = props

  return [
    { label: 'Photo',           unlocked: hasTelegramPhoto },
    { label: 'Premium',         unlocked: isPremium },
    { label: officialChatLabel, unlocked: joinedOfficialChat },
    { label: 'Boost',           unlocked: activeBoosts > 0,       detail: activeBoosts > 0 ? `${activeBoosts}` : undefined },
    { label: 'Rows',            unlocked: purchasedExtraRows > 0, detail: purchasedExtraRows > 0 ? `${purchasedExtraRows}` : undefined },
    { label: 'Real pic',        unlocked: hasRealPhoto },
  ]
}

// ─── Cycling ticker ───────────────────────────────────────────────────
// Shows one criterion at a time, cycling every 2.5 s.
// Green ✓ = unlocked, Red ✗ = not yet unlocked.
function CriterionTicker({ criteria }: { criteria: Criterion[] }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (criteria.length === 0) return
    const timer = setInterval(() => setIdx((p) => (p + 1) % criteria.length), 2500)
    return () => clearInterval(timer)
  }, [criteria.length])

  if (criteria.length === 0) return null
  const c = criteria[idx % criteria.length]

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium ${
        c.unlocked ? 'text-[#00D4AA]' : 'text-[#FF453A]'
      }`}
    >
      <span className="font-bold">{c.unlocked ? '✓' : '✗'}</span>
      <span className="truncate max-w-[130px]">
        {c.label}{c.detail ? ` ${c.detail}` : ''}
      </span>
    </span>
  )
}

// ─── StatsBar ─────────────────────────────────────────────────────────
export function StatsBar({
  lang,
  appVersion,
  isPremium,
  hasTelegramPhoto = false,
  hasRealPhoto = false,
  joinedOfficialChat = false,
  purchasedExtraRows = 0,
  activeBoosts = 0,
  gridRowsUnlocked,
  officialChatLabel,
  showBadgeLegend = true,
  channelFollowUnlock: _channelFollowUnlock,
  children,
  invisibleUnlocked,
  filtersUnlocked,
  hideAgeUnlocked,
  profileLocked,
  onPromptUnlockProfile,
}: StatsBarProps) {
  const version = `v${CORE_VERSION}.${appVersion}.${BUILD_VERSION}`

  const criteria = buildCriteria({
    lang,
    appVersion,
    isPremium,
    hasTelegramPhoto,
    hasRealPhoto,
    joinedOfficialChat,
    purchasedExtraRows,
    activeBoosts,
    gridRowsUnlocked,
    officialChatLabel,
  })

  return (
    <div className="px-3 py-1 flex flex-col gap-0.5">

      {/* ── Main row ─────────────────────────────────────────────── */}
      {/* Left: total rows unlocked | Right: cycling criterion ticker */}
      <div className="flex items-center justify-between gap-2">

        {/* Left side — rows unlocked */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[var(--app-primary)] font-bold text-[11px]">
            {gridRowsUnlocked}
          </span>
          <span className="text-[#48484A] text-[10px]">
            {lang === 'tc' ? '行已解鎖' : lang === 'sc' ? '行已解锁' : 'rows unlocked'}
          </span>
          <span className="text-[#2C2C2E] text-[9px]">·</span>
          <span className="text-[#3A3A3C] text-[9px]">{version}</span>
        </div>

        {/* Right side — cycling unlock criterion */}
        <div className="flex items-center overflow-hidden">
          <CriterionTicker criteria={criteria} />
        </div>
      </div>

      {/* ── Badge legend row ───────────────────────────────────────────────── */}
      {/* Appears after the cycling ticker. Explains the badge icons on grid tiles. */}
      {showBadgeLegend && (
        <div className="flex items-center gap-3 text-[9px] text-[#636366]">
          <span className="flex items-center gap-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00D4AA] mr-0.5" />
            {lang === 'tc' ? '在線' : lang === 'sc' ? '在线' : 'Online'}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="text-[9px]">&#11088;</span>
            {lang === 'tc' ? 'Telegram收費訊息' : lang === 'sc' ? 'Telegram收费消息' : 'Charges for msgs'}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="text-[9px]">&#128065;&#65039;</span>
            {lang === 'tc' ? '隱身' : lang === 'sc' ? '隐身' : 'Invisible'}
          </span>
        </div>
      )}

      {/* ── Optional children (app-specific extras) ── */}
      {children && (
        <div className="flex items-center gap-2 flex-wrap text-[9px] text-[#8E8E93]">
          {children}
        </div>
      )}

      {/* ── Legacy unlock badges (LMN / optional) ── */}
      {(invisibleUnlocked !== undefined || filtersUnlocked !== undefined || hideAgeUnlocked !== undefined || profileLocked) && (
        <div className="flex items-center gap-2 flex-wrap">
          {invisibleUnlocked && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
              👁️‍🗨️ {lang === 'tc' ? '隱形' : lang === 'sc' ? '隐形' : lang === 'ru' ? 'Невидимый' : 'Invisible'}
            </span>
          )}
          {filtersUnlocked && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#5AC8FA]/10 text-[#5AC8FA] border border-[#5AC8FA]/20 flex items-center gap-1">
              🔓 {lang === 'tc' ? '篩選器' : lang === 'sc' ? '筛选器' : lang === 'ru' ? 'Фильтры' : 'Filters'}
            </span>
          )}
          {hideAgeUnlocked && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center gap-1">
              🙈 {lang === 'tc' ? '隱藏年齡' : lang === 'sc' ? '隐藏年龄' : lang === 'ru' ? 'Скрыть возраст' : 'Hide Age'}
            </span>
          )}
          {profileLocked && onPromptUnlockProfile && (
            <button
              onClick={onPromptUnlockProfile}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 flex items-center gap-1 nav-press"
            >
              🔒 {lang === 'tc' ? '購買解鎖以編輯個人資料' : lang === 'sc' ? '购买解锁以编辑个人资料' : lang === 'ru' ? 'Купите разблокировку для редактирования' : 'Purchase unlock to change profile'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
