import { useState } from 'react';

export function useFilters({ config }: { config: any }) {
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [hasPicOnly, setHasPicOnly] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    const initial: any = {};
    Object.keys(config).forEach(key => {
      const f = config[key];
      initial[key] = f.default ?? (f.allowAll ? 'all' : f.options?.[0]?.value);
    });
    return initial;
  });

  const toggleOnline = () => setOnlineOnly(!onlineOnly);
  const toggleHasPic = () => setHasPicOnly(!hasPicOnly);

  const setPreference = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return {
    onlineOnly,
    hasPicOnly,
    toggleOnline,
    toggleHasPic,
    preferences,
    setPreference,
  };
}
