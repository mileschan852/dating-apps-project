export type ProductKey =
  | 'invisible'
  | 'filters'
  | 'extra_row'
  | 'raffle_ticket'
  | 'profile_edit'
  | 'flying_message';

export const PRODUCT_PRICES: Record<ProductKey, number> = {
  invisible: 1000,
  filters: 800,
  extra_row: 500,
  raffle_ticket: 100,
  profile_edit: 500,
  flying_message: 10,
};
