// Library entry point — exports TemplateApp and shared template utilities
// for use by app-specific packages (e.g. HKMO_D_Bot).

export { default, type TemplateAppProps, TEMPLATE_APP_CONFIG } from './App';

// Shared components (template-layer only — not in @dating/core or @dating/ui)
export { FilterRow } from './components/FilterRow';
export type { FilterRowProps } from './components/FilterRow';
export { ProfileEditPage } from './components/ProfileEditPage';
export type { ProfileEditPageProps } from './components/ProfileEditPage';

// Re-export everything apps need from @dating/core so they only need to import from 'app-base'
export {
  useGridUnlock, useGridFilters, usePurchase, useInvisibleMode, isAdminUser,
  DEFAULT_PRODUCT_PRICES, DEFAULT_BASE_ROWS, USERS_PER_ROW, MAX_GRID_USERS,
} from '@dating/core';
export type {
  GridUnlockConfig, GridUnlockResult,
  GridFilters, UseGridFiltersReturn,
  UsePurchaseOptions,
  ProductKey,
} from '@dating/core';
