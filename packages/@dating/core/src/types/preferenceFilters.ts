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
