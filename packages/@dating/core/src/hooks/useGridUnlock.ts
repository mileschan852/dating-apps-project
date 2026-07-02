import { useMemo } from 'react';
import { DEFAULT_BASE_ROWS, USERS_PER_ROW, MAX_GRID_USERS } from '../constants/products';

/**
 * Unlock sources — each contributes +1 row when the condition is met.
 *
 * | Source                        | Rows |
 * |-------------------------------|------|
 * | Base (always)                 | +2   |
 * | Has Telegram profile photo    | +1   |
 * | Telegram Premium subscriber   | +1   |
 * | Joined official group chat    | +1   |
 * | Purchased extra rows (Stars)  | +N   |
 * | Active boosts                 | +N   |
 * | Has verified real photo       | +1   |
 *
 * Maximum rows is capped so the grid never exceeds MAX_GRID_USERS (100).
 */
export interface GridUnlockConfig {
  /** User has a Telegram profile photo set */
  hasTelegramPhoto?: boolean;
  /** User is a Telegram Premium subscriber */
  isPremium?: boolean;
  /** User has joined the official group chat */
  joinedOfficialChat?: boolean;
  /** Number of extra rows purchased with Stars */
  purchasedExtraRows?: number;
  /** Number of currently active boost slots */
  activeBoosts?: number;
  /** User has a verified real photo badge */
  hasRealPhoto?: boolean;
  /** Override base rows (default: DEFAULT_BASE_ROWS = 2) */
  baseRows?: number;
}

export interface GridUnlockResult {
  /** Total unlocked rows (base + bonuses, capped at MAX_GRID_USERS / USERS_PER_ROW) */
  unlockedRows: number;
  /** Total unlocked profile slots = unlockedRows × USERS_PER_ROW */
  unlockedSlots: number;
  /** Per-source breakdown for StatsBar display */
  breakdown: {
    base: number;
    photo: number;
    premium: number;
    chat: number;
    purchased: number;
    boosts: number;
    realPhoto: number;
  };
}

const MAX_ROWS = Math.floor(MAX_GRID_USERS / USERS_PER_ROW); // 20 rows = 100 users

/**
 * Pure function — usable outside React (tests, server logic).
 */
export function calculateUnlockedRows(config: GridUnlockConfig = {}): GridUnlockResult {
  const base = config.baseRows ?? DEFAULT_BASE_ROWS;
  const photo = config.hasTelegramPhoto ? 1 : 0;
  const premium = config.isPremium ? 1 : 0;
  const chat = config.joinedOfficialChat ? 1 : 0;
  const purchased = Math.max(0, config.purchasedExtraRows ?? 0);
  const boosts = Math.max(0, config.activeBoosts ?? 0);
  const realPhoto = config.hasRealPhoto ? 1 : 0;

  const total = Math.min(base + photo + premium + chat + purchased + boosts + realPhoto, MAX_ROWS);

  return {
    unlockedRows: total,
    unlockedSlots: total * USERS_PER_ROW,
    breakdown: { base, photo, premium, chat, purchased, boosts, realPhoto },
  };
}

/**
 * React hook — memoised wrapper around calculateUnlockedRows.
 */
export function useGridUnlock(config: GridUnlockConfig = {}): GridUnlockResult {
  return useMemo(
    () => calculateUnlockedRows(config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      config.hasTelegramPhoto,
      config.isPremium,
      config.joinedOfficialChat,
      config.purchasedExtraRows,
      config.activeBoosts,
      config.hasRealPhoto,
      config.baseRows,
    ]
  );
}
