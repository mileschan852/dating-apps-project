export type ProductKey = 
  | 'invisible_1month'
  | 'filters_unlock_1month'
  | 'extra_row'
  | 'raffle_ticket'
  | 'profile_edit_unlock'
  | 'flying_message';

export const PRODUCT_PRICES: Record<ProductKey, number> = {
  invisible_1month: 1000,
  filters_unlock_1month: 800,
  extra_row: 500,
  raffle_ticket: 100,
  profile_edit_unlock: 500,
  flying_message: 5,
};

export const DEFAULT_PRODUCT_PRICES = PRODUCT_PRICES;
export const DEFAULT_BASE_ROWS = 2;
export const USERS_PER_ROW = 5;
export const MAX_GRID_USERS = 100;
