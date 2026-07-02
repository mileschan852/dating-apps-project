import { useEffect, useRef } from 'react';

export interface UseHeartbeatOptions {
  /** Async function that updates the user's online status in DB */
  updateFn: () => Promise<void>;
  /** Interval in ms. Default 60000 (1 min) */
  intervalMs?: number;
  /** Whether the heartbeat is active (e.g. user is not invisible) */
  enabled?: boolean;
}

/**
 * Sends periodic heartbeats to keep the user's is_online / updated_at fresh.
 * Fires immediately on mount, then every intervalMs.
 */
export function useHeartbeat({
  updateFn,
  intervalMs = 60_000,
  enabled = true,
}: UseHeartbeatOptions) {
  const fnRef = useRef(updateFn);
  fnRef.current = updateFn;

  useEffect(() => {
    if (!enabled) return;
    const run = () => fnRef.current().catch((e) => console.warn('heartbeat error:', e));
    run();
    const id = setInterval(run, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
}
