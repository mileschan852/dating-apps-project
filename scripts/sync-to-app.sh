#!/bin/bash
#
# Sync script: dating-apps-project → App (e.g. HKMO_D_Bot)
# Run from monorepo root: ./scripts/sync-to-app.sh ../HKMO_D_Bot
#
# Modes:
#   --source     Copy source files (recommended during active development)
#   --build      Build packages first, then copy dist/ (cleaner for stable releases)
#
# Example:
#   ./scripts/sync-to-app.sh ../HKMO_D_Bot --source

set -e

APP_PATH=$1
MODE=${2:---source}

if [ -z "$APP_PATH" ]; then
  echo "Usage: ./scripts/sync-to-app.sh <path-to-app> [--source | --build]"
  echo "Example: ./scripts/sync-to-app.sh ../HKMO_D_Bot --source"
  exit 1
fi

if [ ! -d "$APP_PATH" ]; then
  echo "Error: App path does not exist: $APP_PATH"
  exit 1
fi

CORE_SRC="packages/@dating/core/src"
UI_SRC="packages/@dating/ui/src"

CORE_TARGET="$APP_PATH/src/dating-core"
UI_TARGET="$APP_PATH/src/dating-ui"

if [ "$MODE" == "--build" ]; then
  echo "🔄 Building packages..."
  pnpm turbo run build --filter=@dating/core --filter=@dating/ui

  echo "📦 Syncing built dist folders..."
  rsync -av --delete packages/@dating/core/dist/ "$CORE_TARGET/"
  rsync -av --delete packages/@dating/ui/dist/ "$UI_TARGET/"

elif [ "$MODE" == "--source" ]; then
  echo "📦 Syncing source folders (development mode)..."
  rsync -av --delete "$CORE_SRC/" "$CORE_TARGET/"
  rsync -av --delete "$UI_SRC/" "$UI_TARGET/"

else
  echo "Unknown mode: $MODE"
  echo "Use --source or --build"
  exit 1
fi

echo "✅ Sync complete to $APP_PATH"
