// ─── Product constants — canonical source of truth ───────────────────
// Apps can override prices by passing their own priceMap to usePurchase.

export const DEFAULT_PRODUCT_PRICES = {
  invisible_1month:      1000,
  filters_unlock_1month:  800,
  extra_row:              500,
  raffle_ticket:          100,
  profile_edit_unlock:    500,
  flying_message:           5,
} as const;

export type ProductKey = keyof typeof DEFAULT_PRODUCT_PRICES;

/** Base rows every user starts with (before any unlocks) */
export const DEFAULT_BASE_ROWS = 2;

/** Number of user tiles per grid row */
export const USERS_PER_ROW = 5;

/** Grid always renders this many user tiles (padded with locked tiles if needed) */
export const MAX_GRID_USERS = 100;
