import { useState, useCallback, useRef } from 'react';

export interface UseRefreshCooldownOptions {
  /** Cooldown duration in ms. Default 30000 (30s) */
  cooldownMs?: number;
}

export function useRefreshCooldown({ cooldownMs = 30_000 }: UseRefreshCooldownOptions = {}) {
  const [canRefresh, setCanRefresh] = useState(true);
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endRef = useRef<number>(0);

  const markRefreshed = useCallback(() => {
    setCanRefresh(false);
    endRef.current = Date.now() + cooldownMs;

    const tick = () => {
      const left = Math.max(0, endRef.current - Date.now());
      setRemaining(left);
      if (left <= 0) {
        setCanRefresh(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(tick, 1000);
    tick();
  }, [cooldownMs]);

  const remainingFormatted = remaining > 0
    ? `${Math.ceil(remaining / 1000)}s`
    : '';

  return { canRefresh, remaining, remainingFormatted, markRefreshed };
}
