export interface PreferenceFilterConfig {
  type: 'tags' | 'role' | 'slider';
  label: string;
  unlocked?: boolean;
  allowAll?: { label: string };
  colour?: string;
  default?: any;
  options?: any[];
  groupBehavior?: string;
}
