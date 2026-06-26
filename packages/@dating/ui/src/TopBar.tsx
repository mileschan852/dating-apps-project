import { RefreshCw, Eye, EyeOff } from 'lucide-react'
import { RaffleStatusDisplay } from './RaffleStatusDisplay'
import { RaffleButton } from './RaffleButton'
import type { Raffle } from '@dating/core'
import type { Lang } from '@dating/core/i18n'
import { useMemo } from 'react'

interface TopBarProps {
  // Logo area (app-specific)
  logo: React.ReactNode
  appName: string

  // Raffle section
  raffle: Raffle | null
  isAdmin: boolean
  onBuyRaffleTicket: () => void
  onStartNextRaffle: () => void
  lang: Lang

  // Invisible mode
  isInvisible: boolean
  invisiblePurchased: boolean
  onToggleInvisible: () => void

  // Unlock
  onPromptUnlockProfile: () => void

  // Refresh
  lastRefreshTime: number
  onRefresh: () => void

  // Language
  langLabel: string
  onCycleLang: () => void
}

export function TopBar({
  logo,
  appName,
  raffle,
  isAdmin,
  onBuyRaffleTicket,
  onStartNextRaffle,
  lang,
  isInvisible,
  invisiblePurchased,
  onToggleInvisible,
  onPromptUnlockProfile,
  lastRefreshTime,
  onRefresh,
  langLabel,
  onCycleLang,
}: TopBarProps) {
  const refreshDisabled = useMemo(
    () => Date.now() - lastRefreshTime < 30 * 1000,
    [lastRefreshTime]
  )

  return (
    <div className="relative z-40 bg-[#0A0A0A] border-b border-[#2C2C2E] px-3 py-2 flex items-center justify-between">
      {/* LEFT: Logo + App Name + Raffle + Dot Matrix Timer */}
      <div className="flex items-center gap-2">
        {logo}
        <h1 className="text-xl font-bold gradient-text tracking-tight">{appName}</h1>
        <div className="w-px h-5 bg-[#2C2C2E] mx-0.5" />
        <RaffleButton
          raffle={raffle}
          isAdmin={isAdmin}
          onBuyTicket={onBuyRaffleTicket}
          onStartNextRaffle={onStartNextRaffle}
          lang={lang}
        />
        <RaffleStatusDisplay raffle={raffle} lang={lang} />
      </div>

      {/* RIGHT: Invisible | Unlock | Refresh | Language */}
      <div className="flex items-center gap-2">
        {/* Invisible mode toggle — Eye (visible) / EyeOff (invisible) */}
        <button
          onClick={onToggleInvisible}
          className={`w-7 h-7 rounded-full flex items-center justify-center nav-press border transition-all ${
            isInvisible ? 'bg-purple-500/30 text-purple-400 border-purple-500/40' : 'bg-[#1A1A1A] text-[#8E8E93] border-[#2C2C2E]'
          }`}
          title={isInvisible ? 'Invisible' : 'Visible'}
        >
          {isInvisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {/* Unlock profile lock */}
        <button
          onClick={onPromptUnlockProfile}
          className="w-7 h-7 rounded-full bg-[var(--app-primary)]/20 border border-[var(--app-primary)]/30 flex items-center justify-center nav-press transition-all active:scale-90"
        >
          <span className="text-[10px]">🔓</span>
        </button>

        {/* Refresh — dimmed when on 30s cooldown */}
        <button
          onClick={() => { if (!refreshDisabled) onRefresh() }}
          className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all active:scale-90 ${
            refreshDisabled ? 'opacity-30 bg-[#111] border-[#222] cursor-not-allowed' : 'bg-[#1A1A1A] border-[#2C2C2E] nav-press'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshDisabled ? 'text-[#444]' : 'text-[#8E8E93]'}`} />
        </button>

        {/* Language */}
        <button
          onClick={onCycleLang}
          className="text-[10px] font-bold text-[var(--app-primary)] px-2 py-1 rounded-full bg-[var(--app-primary)]/10 border border-[var(--app-primary)]/30 nav-press"
        >
          {langLabel}
        </button>
      </div>
    </div>
  )
}
