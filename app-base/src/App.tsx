import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getTg, getUserId, getUsername, getDefaultLang, getLangLabel,
  dbToProfile, isUserActive, haversineKm, setUserLocation,
  useTelegramPhoto, useHeartbeat, useFlyingMessages,
  fetchUserById, fetchAllUsers, upsertUser, setOnlineStatus,
  insertFlyingMessage, fetchFlyingMessages,
  useGridFilters, useGridUnlock, useInvisibleMode, isAdminUser,
  type UserProfile, type Lang, type AppConfig,
} from '@dating/core';
import {
  TopBar, BottomNav, ProfileGrid, StatsBar,
  FlyingMessagesOverlay, LocationGate,
} from '@dating/ui';
import { FilterRow } from './components/FilterRow';
import { ProfileEditPage } from './components/ProfileEditPage';

// ─── App Config (Template) ────────────────────────────────────────────
export const TEMPLATE_APP_CONFIG: AppConfig = {
  showAge: true,
  showDob: false,
  showZodiac: true,
  showGender: true,
  showHeight: true,
  showWeight: true,
  showPosition: false,
  showDistance: true,
  defaultGender: 'Male',
  defaultSeekingGender: 'Everyone',
  preferences: [],
};

const TABLE = 'users';

function makeDefaultProfile(tgId: number, tgName: string, tgUsername?: string): UserProfile {
  return {
    id: String(tgId),
    name: tgName,
    gender: 'Male',
    height: 170,
    weight: 65,
    preferences: {},
    showAge: true,
    showDob: false,
    showZodiac: true,
    showGender: true,
    showHeight: true,
    showWeight: true,
    showPosition: false,
    showDistance: true,
    seekingGender: 'Everyone',
    seekingAgeMin: 18,
    seekingAgeMax: 99,
    tgUsername,
    hasPhoto: false,
    isOnline: true,
    distance: 0,
    openToMessages: true,
    isInvisible: false,
    hideAge: false,
    filtersUnlocked: false,
    profileUnlocked: true,
    updatedAt: new Date().toISOString(),
  };
}

// ─── Template App Props ───────────────────────────────────────────────
export interface TemplateAppProps {
  appName?: string;
  logoUrl?: string;
  appVersion?: string;
  appConfig?: AppConfig;
  /** Usernames that have admin access — app-specific */
  adminUsernames?: string[];
  /** Extra filter buttons rendered after Online/HasPic */
  extraFilters?: React.ReactNode;
  /** Extra profile edit fields */
  extraProfileFields?: (
    profile: UserProfile,
    onChange: (field: keyof UserProfile, value: any) => void
  ) => React.ReactNode;
  defaultPrefFilters?: Record<string, string>;
  prefFilterFn?: (user: UserProfile, prefFilters: Record<string, string>) => boolean;
  groupChatUrl?: string;
  referShareUrl?: string;
  walletUrl?: string;
  /** Label shown in the StatsBar ticker for the official chat criterion (e.g. "@HKMembersOnlyChat") */
  officialChatLabel?: string;
}

export default function TemplateApp({
  appName = 'Dating',
  logoUrl,
  appVersion = '1T',
  appConfig: _appConfig = TEMPLATE_APP_CONFIG,
  adminUsernames = [],
  extraFilters,
  extraProfileFields,
  defaultPrefFilters = {},
  prefFilterFn,
  groupChatUrl,
  referShareUrl,
  walletUrl,
  officialChatLabel,
}: TemplateAppProps) {
  // ── Admin ──
  const tgUserForAdmin = useMemo(() => {
    try { return (window as any).Telegram?.WebApp?.initDataUnsafe?.user || null; } catch { return null; }
  }, []);
  const isAdmin = useMemo(
    () => isAdminUser(tgUserForAdmin, adminUsernames),
    [tgUserForAdmin, adminUsernames]
  );
  const [lang, setLang] = useState<Lang>(() => getDefaultLang());
  const [view, setView] = useState<'grid' | 'profile'>('grid');
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  const tgPhoto = useTelegramPhoto();
  const tgUser = useMemo(() => {
    try { return (window as any).Telegram?.WebApp?.initDataUnsafe?.user || null; } catch { return null; }
  }, []);

  // ── Own profile ──
  const [ownProfile, setOwnProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // ── Other users (raw from DB, not filtered) ──
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // ── Location state ──
  // null = not yet known; we show LocationGate when null after profile loads
  const [ownLat, setOwnLat] = useState<number | null>(null);
  const [ownLng, setOwnLng] = useState<number | null>(null);
  // true = user has already granted location (stored in DB) or explicitly skipped
  const [locationResolved, setLocationResolved] = useState(false);

  const { filters, setOnlineOnly, setHasPicOnly } = useGridFilters({ defaultPrefFilters });

  // ── Premium / unlock state (from DB row) ──
  const [isPremium, setIsPremium] = useState(false);
  const [joinedOfficialChat, setJoinedOfficialChat] = useState(false);
  const [purchasedExtraRows, setPurchasedExtraRows] = useState(0);

  // ── Grid unlock — computed from all factors ──
  // hasTelegramPhoto: true when the Telegram photo hook returns a URL
  const hasTelegramPhoto = !!tgPhoto;
  const { unlockedSlots, unlockedRows: gridRowsUnlocked } = useGridUnlock({
    hasTelegramPhoto,
    hasRealPhoto: ownProfile?.hasRealPhoto,
    isPremium,
    joinedOfficialChat,
    purchasedExtraRows,
    activeBoosts: 0, // TODO: wire up when boost system is implemented
  });

  const [hideAgeActive, setHideAgeActive] = useState(false);
  // ── Initial invisible_until — loaded from DB in init, fed into useInvisibleMode ──
  const [initialInvisibleUntil, setInitialInvisibleUntil] = useState<string | null>(null);
  // ── chargesForMessages — read from Telegram initDataUnsafe (not stored in DB) ──
  const chargesForMessages = useMemo(() => {
    try {
      // Telegram sets allows_write_to_pm on the user object when the bot has permission
      // and the user has "charge for messages" enabled.
      const tgU = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      return !!(tgU?.allows_write_to_pm === false); // false = charges; true = free
    } catch { return false; }
  }, []);
  // ─── Init: load own profile ───────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setProfileLoading(true);
      try {
        try {
          const tg = (window as any).Telegram?.WebApp;
          tg?.ready?.();
          tg?.expand?.();
        } catch {}

        const tgId = getUserId();
        if (!tgId) {
          // Dev fallback — no Telegram context
          setOwnProfile(makeDefaultProfile(999999, 'Dev User', 'devuser'));
          setLocationResolved(true); // skip location gate in dev
          setProfileLoading(false);
          return;
        }

        const tgName = tgUser?.first_name || 'User';
        const tgUsername = getUsername();

        let dbRow = await fetchUserById(TABLE, tgId);
        if (!dbRow) {
          dbRow = await upsertUser(TABLE, {
            id: tgId,
            name: tgName,
            tg_username: tgUsername || null,
            is_online: true,
            updated_at: new Date().toISOString(),
          });
        }

        if (dbRow) {
          const profile = dbToProfile(dbRow);
          setOwnProfile({
            ...profile,
            tgPhotoUrl: tgPhoto || profile.tgPhotoUrl,
            hasPhoto: !!(tgPhoto || profile.tgPhotoUrl),
            name: profile.name || tgName,
          });
          setHideAgeActive(!!(dbRow as any).hide_age);
          setIsPremium(!!(dbRow as any).is_premium);
          setJoinedOfficialChat(!!(dbRow as any).joined_official_chat);
          setPurchasedExtraRows(Number((dbRow as any).purchased_extra_rows) || 0);
          // ── Load invisible status from DB ──
          // invisible_until = null → not invisible
          // invisible_until = timestamp in the future → invisible (timed)
          // invisible_until = far-future (year 9999) → admin permanent invisible
          const invUntilRaw = (dbRow as any).invisible_until || null;
          setInitialInvisibleUntil(invUntilRaw);

          // If lat/lng already stored in DB, skip LocationGate
          const storedLat = (dbRow as any).lat ? parseFloat(String((dbRow as any).lat)) : null;
          const storedLng = (dbRow as any).lng ? parseFloat(String((dbRow as any).lng)) : null;
          if (storedLat !== null && storedLng !== null) {
            setOwnLat(storedLat);
            setOwnLng(storedLng);
            setLocationResolved(true);
          }
          // else: locationResolved stays false → LocationGate will be shown
        } else {
          setOwnProfile(makeDefaultProfile(tgId, tgName, tgUsername));
          // No DB row → still show LocationGate
        }
      } catch (err) {
        console.error('App init error:', err);
        setLocationResolved(true); // don't block on error
      } finally {
        setProfileLoading(false);
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update photo when Telegram loads it
  useEffect(() => {
    if (tgPhoto && ownProfile) {
      setOwnProfile((prev) => prev ? { ...prev, tgPhotoUrl: tgPhoto, hasPhoto: true } : prev);
    }
  }, [tgPhoto]);

  // ── Invisible mode — managed by useInvisibleMode hook ──
  // Handles auto-expire timer, admin permanent mode, and DB persistence.
  const { isInvisible, toggleInvisible } = useInvisibleMode({
    isAdmin,
    initialInvisibleUntil,
    onUpdate: useCallback(async (until: string | null) => {
      const tgId = getUserId();
      if (!tgId) return;
      await upsertUser(TABLE, { id: tgId, invisible_until: until } as any);
    }, []),
  });

  // ─── Location granted callback ────────────────────────────────────
  const handleLocationGranted = useCallback(async (lat: number, lng: number) => {
    setOwnLat(lat);
    setOwnLng(lng);
    setLocationResolved(true);
    // Persist to DB
    const tgId = getUserId();
    if (tgId) {
      await setUserLocation(TABLE, tgId, lat, lng);
    }
  }, []);

  // ─── Load other users ─────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      // Write updated_at on every grid load — this is what powers the green dot.
      // The heartbeat also does this every 60s, but we want an immediate write
      // so the user’s own dot is green as soon as they open the app.
      const tgIdForOnline = getUserId();
      if (tgIdForOnline) {
        setOnlineStatus(TABLE, tgIdForOnline, true).catch(() => {});
      }
      const rows = await fetchAllUsers(TABLE, 200);
      const myId = ownProfile?.id || String(getUserId());

      const profiles = rows
        .filter((r) => String(r.id) !== myId)
        .map((r) => {
          const profile = dbToProfile(r);
          // Compute distance from own location if available
          const rLat = r.lat ? parseFloat(String(r.lat)) : null;
          const rLng = r.lng ? parseFloat(String(r.lng)) : null;
          if (ownLat !== null && ownLng !== null && rLat !== null && rLng !== null) {
            profile.distance = haversineKm(ownLat, ownLng, rLat, rLng);
          } else {
            profile.distance = 0;
          }
          return profile;
        });

      // Sort ascending by distance; users with no location go to end
      profiles.sort((a, b) => {
        const aDist = a.distance || 0;
        const bDist = b.distance || 0;
        if (aDist === 0 && bDist === 0) return 0;
        if (aDist === 0) return 1;
        if (bDist === 0) return -1;
        return aDist - bDist;
      });

      setUsers(profiles);
      setLastRefreshTime(Date.now());
    } catch (err) {
      console.error('loadUsers error:', err);
    } finally {
      setUsersLoading(false);
    }
  }, [ownProfile?.id, ownLat, ownLng]);

  // Load users once profile is ready and location is resolved
  useEffect(() => {
    if (!profileLoading && locationResolved) loadUsers();
  }, [profileLoading, locationResolved]);

  // ─── Heartbeat ────────────────────────────────────────────────────
  useHeartbeat({
    enabled: !!ownProfile && !profileLoading,
    updateFn: useCallback(async () => {
      const tgId = getUserId();
      if (tgId) await setOnlineStatus(TABLE, tgId, true);
    }, []),
    intervalMs: 60_000,
  });

  // ─── Flying Messages ──────────────────────────────────────────────
  const { messages: flyingMessages, addLocal, dismiss } = useFlyingMessages({
    fetchFn: useCallback((since: string) =>
      fetchFlyingMessages(since).then((msgs) =>
        msgs.map((m: any) => ({
          id: m.id,
          text: m.text,
          username: m.username || '',
          user_id: m.user_id,
          top_percent: m.top_percent || 0,
          created_at: m.created_at,
        }))
      ),
    []),
    pollIntervalMs: 8_000,
    durationMs: 60_000,
  });

  const handleSend = useCallback(async (text: string) => {
    const tgId = getUserId();
    const username = getUsername() || ownProfile?.name || 'User';
    if (!tgId || !text.trim()) return;
    const tempId = Date.now();
    addLocal({
      id: tempId,
      text: `${username}: ${text}`,
      top: `${Math.floor(Math.random() * 60) + 10}%`,
      username,
    });
    await insertFlyingMessage(tgId, username, text);
  }, [ownProfile?.name, addLocal]);

  // ─── Grid users: matching first (sorted by distance), non-matching after ─
  // Self card is always slot 0 and is never filtered out.
  // Matching users pass all active filters; non-matching users are dimmed but
  // still occupy grid slots so the grid always has content to pad to 100.
  const { gridUsers, matchingIds } = useMemo(() => {
    if (!ownProfile) return { gridUsers: [] as UserProfile[], matchingIds: undefined };

    const own: UserProfile = { ...ownProfile, tgPhotoUrl: tgPhoto || ownProfile.tgPhotoUrl };

    const distSort = (a: UserProfile, b: UserProfile) => {
      const da = a.distance ?? 0;
      const db = b.distance ?? 0;
      if (da === 0 && db === 0) return 0;
      if (da === 0) return 1;  // no location → end
      if (db === 0) return -1;
      return da - db;
    };

    const matching: UserProfile[] = [];
    const nonMatching: UserProfile[] = [];
    for (const u of users) {
      const passes =
        (!filters.onlineOnly || isUserActive(u)) &&
        (!filters.hasPicOnly || u.hasRealPhoto) &&
        (!prefFilterFn || prefFilterFn(u, filters.prefFilters));
      if (passes) matching.push(u);
      else nonMatching.push(u);
    }
    matching.sort(distSort);
    nonMatching.sort(distSort);

    const ids = new Set([own.id, ...matching.map((u) => u.id)]);
    return {
      gridUsers: [own, ...matching, ...nonMatching] as UserProfile[],
      matchingIds: ids,
    };
  }, [ownProfile, users, filters, tgPhoto, prefFilterFn]);

  // ─── Save profile ─────────────────────────────────────────────────
  const handleSaveProfile = useCallback(async (updated: UserProfile) => {
    const tgId = getUserId();
    if (!tgId) return;
    setOwnProfile(updated);
    await upsertUser(TABLE, {
      id: tgId,
      name: updated.name,
      dob: updated.dob || null,
      gender: updated.gender || null,
      height: updated.height,
      weight: updated.weight,
      tg_username: updated.tgUsername || null,
      is_online: true,
      updated_at: new Date().toISOString(),
    });
  }, []);

  const cycleLang = useCallback(() => {
    const langs: Lang[] = ['en', 'tc', 'sc', 'ru'];
    setLang((prev) => langs[(langs.indexOf(prev) + 1) % langs.length]);
  }, []);

  // ─── Loading screen ───────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--app-primary)] border-t-transparent rounded-full spinner" />
          <span className="text-[#8E8E93] text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!ownProfile) return null;

  // ─── Location Gate ────────────────────────────────────────────────
  // Shown once on first launch if no location is stored in DB.
  // User can grant location or skip (skip sets locationResolved without lat/lng).
  if (!locationResolved) {
    return (
      <div className="flex flex-col h-screen bg-[#0A0A0A] text-white">
        <div className="flex-1 min-h-0">
          <LocationGate
            lang={lang}
            onGranted={handleLocationGranted}
          />
        </div>
        {/* Skip button below the gate */}
        <div className="pb-8 px-6 flex justify-center">
          <button
            onClick={() => setLocationResolved(true)}
            className="text-[#8E8E93] text-sm underline underline-offset-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // ─── Profile Edit ─────────────────────────────────────────────────
  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <ProfileEditPage
          profile={ownProfile}
          lang={lang}
          onSave={handleSaveProfile}
          onBack={() => setView('grid')}
          hideAgeActive={hideAgeActive}
          onToggleHideAge={() => setHideAgeActive((v) => !v)}
        >
          {extraProfileFields?.(ownProfile, (field, value) =>
            setOwnProfile((prev) => prev ? { ...prev, [field]: value } : prev)
          )}
        </ProfileEditPage>
      </div>
    );
  }

  // ─── Grid view ────────────────────────────────────────────────────
  const logoNode = logoUrl ? (
    <img src={logoUrl} alt={appName} className="w-7 h-7 rounded-lg object-cover" />
  ) : (
    <div className="w-7 h-7 rounded-lg gradient-btn flex items-center justify-center text-white text-xs font-bold">
      {appName.charAt(0)}
    </div>
  );

  const totalRealUsers = 1 + users.length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Flying messages overlay */}
      <FlyingMessagesOverlay
        messages={flyingMessages}
        onDone={dismiss}
        durationMs={60_000}
      />

      {/* Fixed top chrome */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-[#0A0A0A]">
        <TopBar
          logo={logoNode}
          appName={appName}
          raffle={null}
          isAdmin={isAdmin}
          onBuyRaffleTicket={() => {}}
          onStartNextRaffle={() => {}}
          lang={lang}
          isInvisible={false}
          invisiblePurchased={false}
          onToggleInvisible={() => {}}
          onPromptUnlockProfile={() => setView('profile')}
          lastRefreshTime={lastRefreshTime}
          onRefresh={loadUsers}
          langLabel={getLangLabel(lang)}
          onCycleLang={cycleLang}
        />
        <StatsBar
          lang={lang}
          appVersion={appVersion}
          isPremium={isPremium}
          hasTelegramPhoto={hasTelegramPhoto}
          hasRealPhoto={ownProfile.hasRealPhoto}
          joinedOfficialChat={joinedOfficialChat}
          purchasedExtraRows={purchasedExtraRows}
          activeBoosts={0}
          gridRowsUnlocked={gridRowsUnlocked}
          officialChatLabel={officialChatLabel}
        />
        <FilterRow
          onlineOnly={filters.onlineOnly}
          hasPicOnly={filters.hasPicOnly}
          onToggleOnline={() => setOnlineOnly(!filters.onlineOnly)}
          onToggleHasPic={() => setHasPicOnly(!filters.hasPicOnly)}
        >
          {extraFilters}
        </FilterRow>
      </div>

      {/* Scrollable grid */}
      <div className="pt-[148px] pb-32 px-2">
        {usersLoading && users.length === 0 ? (
          <div className="flex justify-center pt-10">
            <div className="w-6 h-6 border-2 border-[var(--app-primary)] border-t-transparent rounded-full spinner" />
          </div>
        ) : (
          <ProfileGrid
            users={gridUsers}
            ownProfile={{
              ...ownProfile,
              isInvisible,
              chargesForMessages,
            }}
            unlockedSlots={unlockedSlots}
            totalRealUsers={totalRealUsers}
            hasMoreUsers={false}
            onPromptUnlock={() => {}}
            onViewOwnProfile={() => setView('profile')}
            onViewPhoto={(user) => {
              if (user.id === ownProfile.id) setView('profile');
            }}
            isAdmin={isAdmin}
            isLoading={usersLoading}
            matchingIds={matchingIds}
            renderTileBottom={(user) => (
              <div className="absolute bottom-0 left-0 right-0 p-1.5 profile-photo-gradient">
                <p className="text-white text-[11px] font-semibold truncate leading-tight">
                  {user.name}
                </p>
                {user.height ? (
                  <p className="text-white/70 text-[9px] leading-tight">{user.height}cm</p>
                ) : null}
              </div>
            )}
            logoUrl={logoUrl}
          />
        )}
      </div>

      {/* Bottom nav with flying message input */}
      <BottomNav
        lang={lang}
        cooldownRemaining={0}
        onSend={handleSend}
        groupChatUrl={groupChatUrl}
        referShareUrl={referShareUrl}
        walletUrl={walletUrl}
      />
    </div>
  );
}
