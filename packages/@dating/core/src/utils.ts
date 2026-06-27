// Added general grid + filter logic (reusable across apps)

export function buildGridList<T extends {
  id: string;
  distance?: number;
  updatedAt?: string;
  hasRealPhoto?: boolean;
  isSide?: boolean;
  position?: number;
  preferences: Record<string, string>;
  [key: string]: any;
}>({
  ownProfile,
  allUsers,
  filters,
  appConfig,
  isRecentlyActive,
  maxUsers = 100,
}: {
  ownProfile: T;
  allUsers: T[];
  filters: Record<string, string | boolean>;
  appConfig: any;
  isRecentlyActive: (u: T) => boolean;
  maxUsers?: number;
}) {
  // 1. Sort all by distance (closest first)
  const allByDistance = [ownProfile, ...allUsers.filter(u => u.id !== ownProfile.id)]
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

  // 2. Separate matching vs non-matching
  const matching: T[] = [];
  const nonMatching: T[] = [];

  for (const u of allByDistance) {
    let matches = true;

    // Online filter
    if (filters.onlineOnly && !isRecentlyActive(u)) matches = false;

    // Has Pic filter
    if (filters.hasPic === true && !u.hasRealPhoto) matches = false;

    // Role filter (treated as preference)
    if (matches && filters.role && filters.role !== 'All') {
      const roleFilter = filters.role as string;
      if (roleFilter === 'Side') {
        if (!u.isSide) matches = false;
      } else {
        if (u.isSide) matches = false;
        const p = u.position ?? 0.5;
        if (roleFilter === 'Bottom' && p !== 0) matches = false;
        if (roleFilter === 'VB' && (p <= 0 || p > 0.5)) matches = false;
        if (roleFilter === 'V' && p !== 0.5) matches = false;
        if (roleFilter === 'VT' && (p <= 0.5 || p > 1)) matches = false;
        if (roleFilter === 'T' && p !== 1) matches = false;
      }
    }

    // Other preference filters
    if (matches && appConfig?.preferences) {
      for (const cat of appConfig.preferences) {
        const selected = filters[cat.key];
        if (selected && selected !== 'All' && u.preferences[cat.key] !== selected) {
          matches = false;
          break;
        }
      }
    }

    if (matches) {
      matching.push(u);
    } else {
      nonMatching.push(u);
    }
  }

  // 3. Build final list: matching first, then non-matching to reach maxUsers
  let finalList = [...matching];
  if (finalList.length < maxUsers) {
    const needed = maxUsers - finalList.length;
    finalList = [...finalList, ...nonMatching.slice(0, needed)];
  }

  return {
    gridUsers: finalList,
    matchingCount: matching.length,
    totalShown: finalList.length,
  };
}
