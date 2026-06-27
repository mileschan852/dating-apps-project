The full original README content above...

---

## Source of Truth & Sync Workflow (Updated 2026)

**`dating-apps-project` is the single source of truth** for all shared code (`@dating/core` and `@dating/ui`).

### Key Improvements Added

- `buildGridList()` — Smart grid filtering with preference matching + distance sorting
- `migrateUserPreferences()` — Safely migrates old user data to current structure
- `dbToProfile()` — Converts raw DB rows into clean `UserProfile` objects
- `isAdminUser()` — Admin check helper

These utilities are now properly exported and documented in `packages/@dating/core/src/utils.ts`.

### Syncing Changes to Apps (HKMO_D_Bot, LMN, etc.)

When you update shared packages, run the sync script from the monorepo root:

```bash
# Development mode (recommended)
./scripts/sync-to-app.sh ../HKMO_D_Bot --source

# Or using npm shortcut
pnpm sync ../HKMO_D_Bot --source

# For stable releases (builds first)
./scripts/sync-to-app.sh ../HKMO_D_Bot --build
```

You can sync to any app:
```bash
./scripts/sync-to-app.sh ../LMN --source
```

### Recommended Workflow

1. Make changes in `packages/@dating/core` or `packages/@dating/ui`
2. Test in `app-base`
3. Run `pnpm build`
4. Sync to apps using the script above
5. (Optional) Publish to npm with `pnpm publish:packages`

Apps should prefer using the published npm packages when possible. Local copies (`src/dating-core/`, `src/dating-ui/`) are only for active development.

### Barrel Export

All utilities are re-exported from:
```ts
import { buildGridList, migrateUserPreferences, dbToProfile, isAdminUser } from '@dating/core'
```

---

## License

Private — packages are free to use by forks of this project.
