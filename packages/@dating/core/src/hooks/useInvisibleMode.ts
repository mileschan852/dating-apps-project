import { useState, useEffect, useCallback } from 'react';

export interface UseInvisibleModeOptions {
  /** Whether the current user is an admin (admins never auto-expire) */
  isAdmin: boolean;
  /** Initial invisible_until value loaded from DB on app start */
  initialInvisibleUntil?: string | null;
  /** Called when invisible state changes — should PATCH the DB */
  onUpdate: (invisibleUntil: string | null) => Promise<void>;
}

export interface UseInvisibleModeReturn {
  isInvisible: boolean;
  invisibleUntil: string | null;
  /** Enable invisible mode for a given duration in minutes (0 = permanent for admins) */
  enableInvisible: (durationMinutes?: number) => Promise<void>;
  /** Disable invisible mode immediately */
  disableInvisible: () => Promise<void>;
  /** Toggle invisible mode (uses default 60-min duration) */
  toggleInvisible: () => Promise<void>;
}

/** Sentinel value used for permanent admin invisible mode */
const PERMANENT_UNTIL = '9999-12-31T23:59:59.000Z';
const DEFAULT_DURATION_MINUTES = 60;

export function useInvisibleMode({
  isAdmin,
  initialInvisibleUntil = null,
  onUpdate,
}: UseInvisibleModeOptions): UseInvisibleModeReturn {
  const [invisibleUntil, setInvisibleUntil] = useState<string | null>(
    initialInvisibleUntil
  );

  // Derived: is currently invisible?
  const isInvisible =
    !!invisibleUntil &&
    (invisibleUntil === PERMANENT_UNTIL || new Date(invisibleUntil) > new Date());

  // Auto-expire timer — fires when invisible_until passes
  useEffect(() => {
    if (!invisibleUntil || invisibleUntil === PERMANENT_UNTIL) return;
    const msUntilExpiry = new Date(invisibleUntil).getTime() - Date.now();
    if (msUntilExpiry <= 0) {
      setInvisibleUntil(null);
      return;
    }
    const timer = setTimeout(() => setInvisibleUntil(null), msUntilExpiry);
    return () => clearTimeout(timer);
  }, [invisibleUntil]);

  const enableInvisible = useCallback(
    async (durationMinutes = DEFAULT_DURATION_MINUTES) => {
      let until: string;
      if (isAdmin && durationMinutes === 0) {
        until = PERMANENT_UNTIL;
      } else {
        const expiry = new Date(Date.now() + durationMinutes * 60 * 1000);
        until = expiry.toISOString();
      }
      setInvisibleUntil(until);
      await onUpdate(until);
    },
    [isAdmin, onUpdate]
  );

  const disableInvisible = useCallback(async () => {
    // Admins with permanent invisible are never auto-cleared — only manual
    setInvisibleUntil(null);
    await onUpdate(null);
  }, [onUpdate]);

  const toggleInvisible = useCallback(async () => {
    if (isInvisible) {
      await disableInvisible();
    } else {
      await enableInvisible(isAdmin ? 0 : DEFAULT_DURATION_MINUTES);
    }
  }, [isInvisible, isAdmin, enableInvisible, disableInvisible]);

  return {
    isInvisible,
    invisibleUntil,
    enableInvisible,
    disableInvisible,
    toggleInvisible,
  };
}
