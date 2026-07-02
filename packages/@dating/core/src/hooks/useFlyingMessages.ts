import { useState, useEffect, useRef, useCallback } from 'react';

export interface FlyingMessageItem {
  id: number;
  text: string;
  top: string;       // CSS top value, e.g. "23%"
  username: string;
}

export interface UseFlyingMessagesOptions {
  /** Supabase fetch function — receives ISO timestamp, returns messages since then */
  fetchFn: (since: string) => Promise<Array<{
    id: number;
    text: string;
    username: string;
    user_id: number;
    top_percent: number;
    created_at: string;
  }>>;
  /** How often to poll for new messages (ms). Default 8000 */
  pollIntervalMs?: number;
  /** How long each message stays on screen (ms). Default 60000 */
  durationMs?: number;
}

export function useFlyingMessages({
  fetchFn,
  pollIntervalMs = 8000,
  durationMs = 60000,
}: UseFlyingMessagesOptions) {
  const [messages, setMessages] = useState<FlyingMessageItem[]>([]);
  const lastSeenRef = useRef<string>(new Date(Date.now() - 60_000).toISOString());

  const poll = useCallback(async () => {
    try {
      const since = lastSeenRef.current;
      const raw = await fetchFn(since);
      if (!raw || raw.length === 0) return;

      const latest = raw.reduce((max, m) => (m.created_at > max ? m.created_at : max), since);
      lastSeenRef.current = latest;

      const newItems: FlyingMessageItem[] = raw.map((m) => ({
        id: m.id,
        text: m.username ? `${m.username}: ${m.text}` : m.text,
        top: `${m.top_percent || Math.floor(Math.random() * 60) + 10}%`,
        username: m.username,
      }));

      setMessages((prev) => [...prev, ...newItems]);

      newItems.forEach((item) => {
        setTimeout(() => {
          setMessages((prev) => prev.filter((m) => m.id !== item.id));
        }, durationMs);
      });
    } catch (err) {
      console.warn('useFlyingMessages poll error:', err);
    }
  }, [fetchFn, durationMs]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, pollIntervalMs);
    return () => clearInterval(interval);
  }, [poll, pollIntervalMs]);

  const addLocal = useCallback((item: FlyingMessageItem) => {
    setMessages((prev) => [...prev, item]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== item.id));
    }, durationMs);
  }, [durationMs]);

  const dismiss = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { messages, addLocal, dismiss };
}
