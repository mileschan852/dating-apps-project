export type PreferenceInputType = 'slider' | 'tag' | 'checkbox';

export interface PreferenceOption {
  value: string;
  label: string;
  colour?: string;
  unlocked?: boolean;
}

export interface PreferenceFilterConfig {
  type: string;
  inputType: PreferenceInputType;
  label: string;
  unlocked: boolean;
  allowAll?: { label: string };
  colour?: string;
  default: string | number;
  options: PreferenceOption[];
  groupBehavior?: 'party_group' | 'meetup_asymmetric';
}
