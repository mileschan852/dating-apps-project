import { useCallback } from 'react';
import type { UserProfile } from '../types';

export interface UseNearbyRefreshOptions {
  tableName: string;
  fetchFn: (tableName: string, lat?: number | null, lng?: number | null) => Promise<UserProfile[]>;
  setUsers: (users: UserProfile[]) => void;
  setIsLoading: (v: boolean) => void;
  lat?: number | null;
  lng?: number | null;
  isInvisible?: boolean;
  invisibleUntil?: string | null;
}

export function useNearbyRefresh({
  tableName,
  fetchFn,
  setUsers,
  setIsLoading,
  lat,
  lng,
}: UseNearbyRefreshOptions) {
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchFn(tableName, lat, lng);
      setUsers(data);
    } catch (err) {
      console.warn('useNearbyRefresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, fetchFn, setUsers, setIsLoading, lat, lng]);

  return { refresh };
}
