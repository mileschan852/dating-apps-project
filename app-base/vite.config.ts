import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const CORE_ROOT = path.resolve(__dirname, '../packages/@dating/core/src')
const UI_ROOT = path.resolve(__dirname, '../packages/@dating/ui/src')

export default defineConfig({
  base: '/app-base/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.GITHUB_RUN_NUMBER || 'dev'),
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // Subpath exports of @dating/core (must come before the bare alias)
      { find: '@dating/core/styles.css', replacement: path.join(CORE_ROOT, 'styles.css') },
      { find: '@dating/core/i18n', replacement: path.join(CORE_ROOT, 'i18n.ts') },
      { find: '@dating/core/telegram', replacement: path.join(CORE_ROOT, 'telegram.ts') },
      { find: '@dating/core/supabase', replacement: path.join(CORE_ROOT, 'supabase.ts') },
      { find: '@dating/core/storage', replacement: path.join(CORE_ROOT, 'storage.ts') },
      { find: '@dating/core/types', replacement: path.join(CORE_ROOT, 'types.ts') },
      { find: '@dating/core/utils', replacement: path.join(CORE_ROOT, 'utils.ts') },
      { find: '@dating/core/hooks', replacement: path.join(CORE_ROOT, 'hooks.ts') },
      { find: '@dating/core/payments', replacement: path.join(CORE_ROOT, 'payments.ts') },
      { find: '@dating/core/cloudKeys', replacement: path.join(CORE_ROOT, 'cloudKeys.ts') },
      { find: '@dating/core/profileDraft', replacement: path.join(CORE_ROOT, 'profileDraft.ts') },
      { find: '@dating/core/appShell', replacement: path.join(CORE_ROOT, 'appShell.ts') },
      { find: '@dating/core/flyingMessages', replacement: path.join(CORE_ROOT, 'flyingMessages.ts') },
      // Bare alias (must come after subpath aliases)
      { find: '@dating/core', replacement: path.join(CORE_ROOT, 'index.ts') },
      { find: '@dating/ui', replacement: path.join(UI_ROOT, 'index.ts') },
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3002,
  },
})
