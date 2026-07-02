import { useMemo } from 'react';
import type { UserProfile } from '../types';
import { isUserActive } from '../utils';

export interface UseGridUsersOptions {
  users: UserProfile[];
  ownProfile: UserProfile;
  isAdmin: boolean;
  isInvisible: boolean;
  onlineOnly: boolean;
  filterFn: (user: UserProfile) => boolean;
}

export function useGridUsers({
  users,
  ownProfile,
  isAdmin,
  isInvisible,
  onlineOnly,
  filterFn,
}: UseGridUsersOptions) {
  const patchedOwnProfile = useMemo(
    () => ({ ...ownProfile, isInvisible: isInvisible || false }),
    [ownProfile, isInvisible]
  );

  const allGridUsers = useMemo(
    () => [patchedOwnProfile, ...users.filter((u) => u.id !== ownProfile.id)],
    [patchedOwnProfile, users, ownProfile.id]
  );

  const visibleGridUsers = useMemo(
    () => (isAdmin ? allGridUsers : allGridUsers.filter((u) => u.id === ownProfile.id || !u.isInvisible)),
    [isAdmin, allGridUsers, ownProfile.id]
  );

  const filteredGrid = useMemo(
    () =>
      visibleGridUsers.filter((u) => {
        if (u.id === ownProfile.id) return true;
        if (onlineOnly && !isUserActive(u)) return false;
        return filterFn(u);
      }),
    [visibleGridUsers, onlineOnly, filterFn, ownProfile.id]
  );

  return { filteredGrid, visibleGridUsers, allGridUsers, patchedOwnProfile };
}
