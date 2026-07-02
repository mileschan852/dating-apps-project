---
# Getting Started + Architecture Guide

## Overview

This monorepo provides a reusable template for building dating apps as Telegram Mini Apps.

The template consists of two main packages:
- `@dating/core`: Reusable logic, hooks, types, and utilities.
- `@dating/ui`: Reusable UI components.

Apps like `HKMO_D_Bot` live in their own separate repositories and consume this template via npm/pnpm workspaces or published packages.

## Important: Package Manager

This project uses **pnpm** (with workspaces) for the monorepo.

**Recommended commands:**

```bash
# Install dependencies
pnpm install

# Build a specific app
pnpm --filter hkmod-app build

# Build everything
pnpm build
```

Using `npm` will not work correctly with the workspace setup.

## Architecture

- **Template** (`dating-apps-project`): Contains shared core logic and UI components.
- **Apps** (e.g. `HKMO_D_Bot`): Separate repositories that import from the template.

## Core Concepts

### Stats vs Preferences

- **Stats**: User’s own profile data (height, zodiac, age, etc.). Some can be marked as filterable.
- **Preferences**: Used to filter other users on the grid (Role, Drug, Meetup, Where, Safety).

Preferences are **app-specific**. Each app defines its own `preferenceFilters` in its config.

## Getting Started

1. Clone the template (if developing the template itself).
2. For new apps, create a new repository and install the template packages.

```bash
pnpm install
pnpm --filter your-app build
```

## Key Features

- Advanced Preference Filter System with Role slider, `party_group`, `meetup_asymmetric`
- Row Unlocking + Dividing Bar
- Telegram Stars Purchase System
- Locked filters with subscription check
- And more (see full documentation in `/docs`)

## Recommended Reading Order

1. `getting-started-architecture.md` (this file)
2. `preference-filter-system.md`
3. `purchase-system.md`
4. `row-unlocking-dividing-bar.md`

---

*Last updated: Today*