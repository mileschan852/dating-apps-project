import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, ArrowLeft, MapPin, MessageCircle, Lock } from 'lucide-react'
import type { Lang, UserProfile, AppConfig } from '@dating/core'
import { t, formatDist, isUserActive, getZodiac, getZodiacEmoji, getAge, isProfileComplete, getMissingFields, useTelegramPhoto } from '@dating/core'

interface ProfileViewProps {
  user: UserProfile
  lang: Lang
  logoUrl?: string
  appConfig: AppConfig
  onClose?: () => void
  onMessage?: (user: UserProfile) => void
  ownProfile?: UserProfile
  onSave?: (updated: UserProfile) => void
  onBack?: () => void
  editProfileUnlocked?: boolean
  hideAgeActive?: boolean
  onToggleHideAge?: () => void | Promise<void>
}

function FieldLabel({ label }: { label: string }) {
  return <span className="text-xs text-[#8E8E93] font-medium uppercase block mb-1.5">{label}</span>
}

export function ProfileView({
  user, lang, logoUrl, appConfig,
  onClose, onMessage, ownProfile,
  onSave, onBack, editProfileUnlocked = false,
  hideAgeActive = false, onToggleHideAge,
}: ProfileViewProps) {
  const isEdit = !!onSave
  const profileLocked = !editProfileUnlocked

  // Photo carousel state
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [imgStates, setImgStates] = useState<{ loaded: boolean; failed: boolean }[]>([])

  // Read Telegram user data — photo hook retries until Telegram loads it
  const tgPhoto = useTelegramPhoto()
  const tgUser = (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user) || null

  // Edit draft
  const [draft, setDraft] = useState<UserProfile>({ ...user })
  const [saved, setSaved] = useState(false)

  // Full reset when switching users — auto-fill name and photo from Telegram
  useEffect(() => {
    const tgName = tgUser?.first_name || ''
    const photo = tgPhoto || user.tgPhotoUrl || ''
    setDraft({
      ...user,
      name: user.name || tgName,
      tgPhotoUrl: photo,
      tgPhotos: photo ? [photo] : user.tgPhotos,
      hasPhoto: user.hasPhoto || !!photo,
    })
  }, [user.id])

  // Photo: Telegram hook first (freshest), fallback to user.tgPhotoUrl from DB/props
  const photoSrc = tgPhoto || user.tgPhotoUrl || ''
  const displayPhotos = photoSrc ? [photoSrc] : []

  useEffect(() => { setImgStates(displayPhotos.map(() => ({ loaded: false, failed: false }))); setActiveIdx(0) }, [tgPhoto])

  const handleScroll = () => { if (!scrollRef.current) return; setActiveIdx(Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth)) }

  const updateDraft = useCallback(<K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setDraft(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }, [])

  const handleSave = () => {
    if (!onSave) return
    const missing = getMissingFields(draft, appConfig)
    if (missing.length > 0) { alert(`Please fill in: ${missing.join(', ')}`); return }
    onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Derived display values
  const zodiacSign = user.dob ? getZodiac(user.dob) : null
  const zodiacEmoji = zodiacSign ? getZodiacEmoji(zodiacSign) : null
  const userAge = user.dob ? getAge(user.dob) : user.age

  // ── Photo Section ──────────────────────────────────────────────────
  const PhotoSection = ({ size = 'large' }: { size?: 'large' | 'small' }) => (
    <div className={size === 'large' ? 'flex-1 flex items-center relative' : 'relative w-full aspect-square bg-[#1A1A1A] overflow-hidden flex-shrink-0'}>
      {displayPhotos.length > 0 ? (
        <>
          <div ref={scrollRef} onScroll={handleScroll} className={size === 'large' ? 'w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide' : 'w-full h-full'}>
            {displayPhotos.map((photo: string, i: number) => (
              <div key={i} className={size === 'large' ? 'w-full h-full flex-shrink-0 snap-center flex items-center justify-center relative' : 'w-full h-full flex items-center justify-center relative'}>
                {!imgStates[i]?.failed && (
                  <img src={photo} alt={`${user.name} ${i + 1}`} draggable={false} loading="eager" decoding="async"
                    referrerPolicy="no-referrer"
                    className={size === 'large' ? `max-w-full max-h-[65vh] object-contain transition-opacity duration-300 ${imgStates[i]?.loaded ? 'opacity-100' : 'opacity-0'}` : `absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300 ${imgStates[i]?.loaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImgStates(prev => { const n = [...prev]; n[i] = { ...n[i], loaded: true }; return n })}
                    onError={() => setImgStates(prev => { const n = [...prev]; n[i] = { ...n[i], failed: true }; return n })} />
                )}
                {imgStates[i]?.failed && (
                  <div className={size === 'large' ? 'absolute inset-0 flex items-center justify-center' : 'absolute inset-0 flex items-center justify-center z-0'}>
                    <div className={size === 'large' ? 'w-32 h-32 rounded-full bg-[#1A1A1A] flex items-center justify-center px-2' : 'w-20 h-20 rounded-full bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] flex items-center justify-center px-2'}>
                      <span className={`font-medium text-[#8E8E93] text-center truncate w-full ${size === 'large' ? 'text-sm' : 'text-[10px]'}`}>{user.tgUsername ? '@' + user.tgUsername : user.name}</span>
                    </div>
                  </div>
                )}
                {!imgStates[i]?.loaded && !imgStates[i]?.failed && (
                  <div className={size === 'large' ? 'absolute inset-0 flex items-center justify-center' : 'absolute inset-0 flex items-center justify-center z-0'}>
                    <div className={size === 'large' ? 'w-32 h-32 rounded-full bg-[#1A1A1A] flex items-center justify-center' : 'w-20 h-20 rounded-full bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] flex items-center justify-center'}>
                      <span className={`font-bold text-[#8E8E93] ${size === 'large' ? 'text-4xl' : 'text-2xl'}`}>{user.name.charAt(0)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {displayPhotos.length > 1 && (
            <div className={`absolute bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full z-20 ${size === 'large' ? 'top-4 left-4' : 'top-2 right-2'}`}>
              <span className="text-white text-xs font-medium">{activeIdx + 1} / {displayPhotos.length}</span>
            </div>
          )}
        </>
      ) : (
        <div className={size === 'large' ? 'w-full flex items-center justify-center' : 'w-full h-full flex items-center justify-center'}>
          <div className={size === 'large' ? 'w-32 h-32 rounded-full bg-[#1A1A1A] flex items-center justify-center px-2' : 'w-20 h-20 rounded-full bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] flex items-center justify-center px-2'}>
            <span className={`font-medium text-[#8E8E93] text-center truncate w-full ${size === 'large' ? 'text-sm' : 'text-[10px]'}`}>{user.tgUsername ? '@' + user.tgUsername : user.name}</span>
          </div>
        </div>
      )}
      {displayPhotos.length > 1 && size === 'large' && (
        <div className="flex justify-center gap-1.5 pb-3 absolute bottom-4 left-0 right-0">
          {displayPhotos.map((_p: string, i: number) => (<div key={i} className={`h-1.5 rounded-full transition-all duration-200 ${i === activeIdx ? 'w-4 bg-[var(--app-primary)]' : 'w-1.5 bg-[#8E8E93]/40'}`} />))}
        </div>
      )}
    </div>
  )

  // ── Stats Row — controlled by AppConfig ────────────────────────────
  const StatsRow = () => (
    <div className="flex gap-3 mt-3 text-xs flex-wrap items-center">
      {/* Age */}
      {appConfig.showAge && userAge && !user.hideAge && <span className="text-white font-bold">{userAge} years</span>}
      {/* Zodiac */}
      {appConfig.showZodiac && zodiacSign && <span className="text-purple-400 font-bold">{zodiacEmoji} {zodiacSign}</span>}
      {/* DOB */}
      {appConfig.showDob && user.dob && <span className="text-[#8E8E93]">{user.dob}</span>}
      {/* Gender */}
      {appConfig.showGender && user.gender && (
        <span className={`font-bold ${user.gender === 'Male' ? 'text-blue-400' : user.gender === 'Female' ? 'text-pink-400' : 'text-purple-400'}`}>
          {user.gender === 'Male' ? '♂' : user.gender === 'Female' ? '♀' : '⚧'} {user.gender}
        </span>
      )}
      {/* Seeking */}
      {appConfig.showGender && user.seekingGender && (
        <span className="text-[#8E8E93]">seeking {user.seekingGender === 'Men' ? '♂ Men' : user.seekingGender === 'Women' ? '♀ Women' : '⚤ Everyone'}</span>
      )}
      {/* Divider */}
      {(appConfig.showAge && userAge || appConfig.showZodiac && zodiacSign || appConfig.showGender && user.gender) &&
        (appConfig.showHeight && user.height || appConfig.showWeight && user.weight) && (
        <span className="text-[#2C2C2E]">|</span>
      )}
      {/* Height */}
      {appConfig.showHeight && user.height ? <span className="text-[#8E8E93]">{user.height}cm</span> : null}
      {/* Weight */}
      {appConfig.showWeight && user.weight ? <span className="text-[#8E8E93]">{user.weight}kg</span> : null}
      {/* Distance */}
      {appConfig.showDistance && user.distance > 0 && <span className="text-[#8E8E93]">{formatDist(user.distance)}</span>}
      {/* Position */}
      {appConfig.showPosition && (
        user.isSide ? <span className="text-gray-400 font-bold">Side</span> :
        user.position !== undefined ? <span className="text-[var(--app-primary)] font-bold">
          {(() => {
            const p = user.position!
            if (p === 0) return 'Bottom'
            if (p < 0.4) return 'Versatile Bottom'
            if (p === 0.5) return 'Versatile'
            if (p <= 0.9) return 'Versatile Top'
            return 'Top'
          })()}
        </span> : null
      )}
      {/* Preferences */}
      {Object.entries(user.preferences).map(([key, value]) => {
        if (!value) return null
        const cat = appConfig.preferences.find(c => c.key === key)
        const opt = cat?.options.find(o => o.value === value)
        return <span key={key} className={`text-xs font-bold ${opt?.colour || 'text-[#8E8E93]'}`}>{opt?.label[lang] || value}</span>
      })}
      {/* Messages */}
      {user.openToMessages && <span className="font-bold text-yellow-400">⭐ {t(lang, 'message')}</span>}
    </div>
  )

  // ═════════════════════════════════════════════════════════════════════
  // EDIT MODE
  // ═════════════════════════════════════════════════════════════════════

  // Helper: cycle preference to next option
  const cyclePreference = (cat: PreferenceCategory) => {
    const current = draft.preferences[cat.key] || cat.defaultValue
    const idx = cat.options.findIndex(o => o.value === current)
    const next = cat.options[(idx + 1) % cat.options.length]
    updateDraft('preferences', { ...draft.preferences, [cat.key]: next.value })
  }

  if (isEdit) {
    return (
      <div className="view-enter h-full flex flex-col">
        {/* Header */}
        <div className="shrink-0 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#2C2C2E] px-3 py-2.5 flex items-center justify-between z-10">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center nav-press"><ArrowLeft className="w-4 h-4 text-white" /></button>
          <h2 className="text-base font-semibold text-white">{t(lang, 'editProfile')}</h2>
          <div className="w-8" />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <PhotoSection size="small" />

          {/* Incomplete banner */}
          {!isProfileComplete(draft, appConfig) && (
            <div className="mx-4 mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
              <p className="text-yellow-400 text-xs font-semibold">⚠️ Complete your profile to use the app</p>
              <p className="text-[#8E8E93] text-[10px]">Missing: {getMissingFields(draft, appConfig).join(', ')}</p>
            </div>
          )}

          <div className="px-4 py-4 space-y-4">

            {/* ═══ LOCKED SECTION: Core profile fields (locked after save) ═══ */}
            <div className={profileLocked ? 'opacity-40 pointer-events-none select-none' : ''}>
              {/* ── Gender (if visible) ── */}
              {appConfig.showGender && (
                <div className="space-y-1.5">
                  <FieldLabel label="Gender" />
                  <div className="grid grid-cols-3 gap-2">
                    {(['Male', 'Female', 'Non-binary'] as const).map(g => (
                      <button key={g} onClick={() => updateDraft('gender', g)}
                        className={`h-10 rounded-lg text-sm font-medium nav-press transition-all ${draft.gender === g ? 'gradient-btn text-white' : 'bg-[#1A1A1A] border border-[#2C2C2E] text-[#8E8E93]'}`}>
                        {g === 'Male' ? '♂ Male' : g === 'Female' ? '♀ Female' : '⚧ Non-binary'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Seeking (if visible) ── */}
              {appConfig.showGender && (
                <div className="space-y-1.5">
                  <FieldLabel label="Seeking Gender" />
                  <div className="grid grid-cols-3 gap-2">
                    {(['Men', 'Women', 'Everyone'] as const).map(g => (
                      <button key={g} onClick={() => updateDraft('seekingGender', g)}
                        className={`h-10 rounded-lg text-sm font-medium nav-press transition-all ${draft.seekingGender === g ? 'gradient-btn text-white' : 'bg-[#1A1A1A] border border-[#2C2C2E] text-[#8E8E93]'}`}>
                        {g === 'Men' ? '♂ Men' : g === 'Women' ? '♀ Women' : '⚤ Everyone'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Hide Age + DOB (same line) ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FieldLabel label={t(lang, 'dateOfBirth')} />
                    {draft.dob && <span className="text-[#8E8E93] text-[10px]">{getAge(draft.dob)}y · {getZodiac(draft.dob)} {getZodiacEmoji(getZodiac(draft.dob))}</span>}
                  </div>
                  {appConfig.showAge && (
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={hideAgeActive}
                        onChange={() => { if (onToggleHideAge) onToggleHideAge() }}
                        className="w-3 h-3 rounded accent-[var(--app-primary)]" />
                      <span className="text-[10px] text-[#8E8E93]">Hide</span>
                    </label>
                  )}
                </div>
                <input type="date" value={draft.dob || ''}
                  onChange={e => { updateDraft('dob', e.target.value); updateDraft('age', getAge(e.target.value)) }}
                  className="w-full h-8 bg-[#1A1A1A] border border-[#2C2C2E] rounded-lg px-3 text-white text-sm [color-scheme:dark]" />
              </div>

              {/* ── Height + Weight (compact, cm/kg inline) ── */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-1">
                  <input type="number" value={draft.height || ''} placeholder="H"
                    onChange={e => updateDraft('height', Number(e.target.value))}
                    className="flex-1 h-8 bg-[#1A1A1A] border border-[#2C2C2E] rounded-lg px-2 text-white text-sm text-center" />
                  <span className="text-[10px] text-[#8E8E93]">cm</span>
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <input type="number" value={draft.weight || ''} placeholder="W"
                    onChange={e => updateDraft('weight', Number(e.target.value))}
                    className="flex-1 h-8 bg-[#1A1A1A] border border-[#2C2C2E] rounded-lg px-2 text-white text-sm text-center" />
                  <span className="text-[10px] text-[#8E8E93]">kg</span>
                </div>
              </div>

              {/* ── Role slider + Side checkbox (same line) ── */}
              {appConfig.showPosition && (
                <div className="space-y-1">
                  <FieldLabel label="Role" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-400 text-[8px] font-bold">B</span>
                    <div className="flex-1 relative">
                      <input type="range" min="0" max="1" step="0.1"
                        value={draft.isSide ? 0.5 : (draft.position ?? 0)}
                        disabled={draft.isSide}
                        onChange={e => updateDraft('position', Number(e.target.value))}
                        className="w-full accent-[var(--app-primary)] h-4" />
                    </div>
                    <span className="text-orange-400 text-[8px] font-bold">T</span>
                    <label className="flex items-center gap-1 cursor-pointer ml-1">
                      <input type="checkbox" checked={draft.isSide}
                        onChange={e => { updateDraft('isSide', e.target.checked); if (e.target.checked) updateDraft('position', 0.5) }}
                        className="w-3 h-3 rounded accent-[var(--app-primary)]" />
                      <span className="text-[10px] text-[#8E8E93]">Side</span>
                    </label>
                  </div>
                  {(() => {
                    const p = draft.position ?? 0.5
                    let word = 'Versatile'
                    if (p === 0) word = 'Bottom'
                    else if (p < 0.4) word = 'Versatile Bottom'
                    else if (p === 0.5) word = 'Versatile'
                    else if (p <= 0.9) word = 'Versatile Top'
                    else word = 'Top'
                    if (draft.isSide) word = 'Side'
                    return <p className="text-[var(--app-primary)] text-[10px] font-medium">{word}</p>
                  })()}
                </div>
              )}

              {/* ═══ 3 Preferences in one row (no left labels) ═══ */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {appConfig.preferences.map(cat => {
                  const currentVal = draft.preferences[cat.key] || cat.defaultValue
                  const currentOpt = cat.options.find(o => o.value === currentVal)
                  return (
                    <button key={cat.key} onClick={() => cyclePreference(cat)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold nav-press transition-all ${currentOpt?.colour || 'bg-[#1A1A1A] text-[#8E8E93] border border-[#2C2C2E]'}`}>
                      {currentOpt?.label[lang] || currentOpt?.label['en'] || currentVal}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Save */}
        <div className="shrink-0 px-4 py-3 border-t border-[#2C2C2E] bg-[#0A0A0A]">
          <button onClick={handleSave} className={`w-full h-12 rounded-xl text-white font-semibold text-sm nav-press transition-all ${saved ? 'bg-green-500' : 'gradient-btn'}`}>
            {saved ? '✓ Saved' : isProfileComplete(draft, appConfig) ? t(lang, 'save') : `Complete Profile (${getMissingFields(draft, appConfig).length} missing)`}
          </button>
        </div>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════
  // VIEW MODE
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[60] bg-black/95 flex flex-col animate-in fade-in duration-200" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#1A1A1A]/80 flex items-center justify-center z-20 nav-press"><X className="w-5 h-5 text-white" /></button>
      <PhotoSection size="large" />
      <div className="w-full px-4 pb-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">
              {user.name}
              {appConfig.showAge && userAge && !user.hideAge ? `, ${userAge}` : ''}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {appConfig.showDistance && <><MapPin className="w-3.5 h-3.5 text-[var(--app-primary)]" /><span className="text-[#8E8E93] text-xs">{formatDist(user.distance)}</span></>}
              {isUserActive(user) && <span className="ml-2 px-1.5 py-0.5 bg-[#00D4AA]/20 text-[#00D4AA] text-[10px] font-bold rounded-full">{t(lang, 'online').toUpperCase()}</span>}
            </div>
          </div>
          {onMessage && (
            <button onClick={() => onMessage(user)} className="h-10 gradient-btn rounded-xl text-white font-semibold text-sm nav-press flex items-center gap-2 px-5">
              <MessageCircle className="w-4 h-4" />
              {user.openToMessages ? '⭐ ' + t(lang, 'message') : t(lang, 'message')}
            </button>
          )}
        </div>
        <StatsRow />
      </div>
    </div>
  )
}
