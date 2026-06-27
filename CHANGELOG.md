# Changelog

All notable changes to the shared packages will be documented in this file.

## [1.1.0] - 2026-06-27

### Added
- `buildGridList()` — Powerful grid filtering utility with preference matching + distance-based sorting
- `migrateUserPreferences()` — Safe migration helper for old user data structures
- `dbToProfile()` — Converts raw database rows into clean `UserProfile` objects
- `isAdminUser()` — Admin check helper with ID and username support

### Changed
- Improved barrel exports in `@dating/core`
- Stabilized `utils.ts` as the central utility file
- Added `scripts/sync-to-app.sh` for easy syncing from monorepo to apps

### Notes
- `dating-apps-project` is now the official source of truth
- Both `@dating/core` and `@dating/ui` bumped to v1.1.0
