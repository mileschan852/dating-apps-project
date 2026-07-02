// packages/@dating/core/src/types/preferenceFilters.ts

export type PreferenceInputType = 'slider' | 'tag' | 'checkbox';
export type FilterType = 'role' | 'tags' | 'boolean';

export interface PreferenceOption {
  value: string;
  label: string;
  colour?: string;
  unlocked?: boolean;
}

export interface PreferenceFilterConfig {
  type: FilterType;
  label: string;
  inputType: PreferenceInputType;
  unlocked: boolean;
  allowAll?: { label: string };
  colour?: string;
  default: any;
  options?: PreferenceOption[];
  groupBehavior?: 'party_group' | 'meetup_asymmetric' | string;
}

export interface PreferenceFiltersConfig {
  [key: string]: PreferenceFilterConfig;
}

export interface UserStatConfig {
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  visibleOnEditProfile: boolean;
  default?: any;
  options?: Array<{ value: string; label: string }>;
}

export interface UserStatsConfig {
  [key: string]: UserStatConfig;
}

export interface ActiveFilters {
  onlineOnly: boolean;
  hasPicOnly: boolean;
  preferences: Record<string, any>;
}
