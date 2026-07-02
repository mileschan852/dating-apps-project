# Dating Apps Project (Template)

This is the reusable monorepo template for building dating apps (Telegram Mini Apps).

## Architecture

- **`packages/@dating/core`** — Reusable logic, hooks, types, and utilities.
- **`packages/@dating/ui`** — Reusable UI components.
- Apps (e.g. `HKMO_D_Bot`) live in their own separate repositories and consume this template.

## Preference Filter System (Current State)

The template provides a flexible system for building preference filters on the grid.

### Key Features Supported

| Feature                    | Description                                                                 | Supported |
|---------------------------|-----------------------------------------------------------------------------|---------|
| `inputType`               | `'slider'`, `'tag'`, or `'checkbox'`                                        | Yes     |
| `unlocked`                | Whether the filter stays unlocked after user saves their profile                  | Yes     |
| `allowAll`                | Shows a custom "All / Any" option (e.g. "Party", "Any", "Anywhere")         | Yes     |
| `groupBehavior`           | Special matching rules (`party_group`, `meetup_asymmetric`)                 | Yes     |
| Role + Side exclusivity   | Slider (0–1) + Side checkbox. Side is disabled when slider ≠ 0.5            | Yes     |
| Locked filters            | Shows lock icon + triggers invoice flow when user has no subscription       | Yes     |
| Auto-sizing after divider | Filters after `dividingIndex` render smaller                                | Yes     |

### How Apps Should Define Preferences

Each app defines its own `preferenceFilters` in its config (preferences are **app-specific**).

Example structure is available in the `HKMO_D_Bot` repository.

### Core Components & Hooks

- `FilterBar` + `PreferenceFilter`
- `ProfileGrid` (with main dividing bar support)
- `useFilters` hook
- `doesUserMatchFilters` utility

---

## Getting Started

```bash
pnpm install
pnpm --filter hkmod-app build
```