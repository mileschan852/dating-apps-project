// ... existing code + new migration helper

export function migrateUserPreferences(rawUser: any, appConfig: AppConfig): UserProfile {
  const prefs: Record<string, string> = {};

  // Start with existing preferences if present
  if (rawUser.preferences) {
    Object.assign(prefs, rawUser.preferences);
  }

  // Example migration rules (add more as needed when old data appears)
  // If old key 'safetyLevel' existed, map to current 'safety'
  if (rawUser.safetyLevel && !prefs.safety) {
    prefs.safety = rawUser.safetyLevel;
  }

  // Ensure all current preference categories have a value
  if (appConfig?.preferences) {
    for (const cat of appConfig.preferences) {
      if (!prefs[cat.key]) {
        prefs[cat.key] = cat.defaultValue || cat.options[0]?.value || '';
      }
    }
  }

  return {
    ...rawUser,
    preferences: prefs,
    hasRealPhoto: rawUser.hasRealPhoto ?? rawUser.hasPhoto ?? false,
  } as UserProfile;
}
