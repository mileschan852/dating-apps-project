import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export function createBaseConfig(options: { port?: number; base?: string } = {}) {
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'
  const defaultBase = isGitHubPages ? './' : '/'
  return defineConfig({
    base: options.base || defaultBase,
    plugins: [react()],
    server: { port: options.port || 3000 },
    build: {
      outDir: 'dist',
      sourcemap: true,
      assetsInlineLimit: 0,
    },
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./src"),
        "@dating/core": path.resolve(process.cwd(), "../../packages/@dating/core/src"),
        "@dating/core/i18n": path.resolve(process.cwd(), "../../packages/@dating/core/src/i18n.ts"),
        "@dating/core/telegram": path.resolve(process.cwd(), "../../packages/@dating/core/src/telegram.ts"),
        "@dating/core/storage": path.resolve(process.cwd(), "../../packages/@dating/core/src/storage.ts"),
        "@dating/core/supabase": path.resolve(process.cwd(), "../../packages/@dating/core/src/supabase.ts"),
        "@dating/core/types": path.resolve(process.cwd(), "../../packages/@dating/core/src/types.ts"),
        "@dating/core/utils": path.resolve(process.cwd(), "../../packages/@dating/core/src/utils.ts"),
        "@dating/core/hooks": path.resolve(process.cwd(), "../../packages/@dating/core/src/hooks.ts"),
        "@dating/core/payments": path.resolve(process.cwd(), "../../packages/@dating/core/src/payments.ts"),
        "@dating/core/flyingMessages": path.resolve(process.cwd(), "../../packages/@dating/core/src/flyingMessages.ts"),
        "@dating/core/cloudKeys": path.resolve(process.cwd(), "../../packages/@dating/core/src/cloudKeys.ts"),
        "@dating/core/profileDraft": path.resolve(process.cwd(), "../../packages/@dating/core/src/profileDraft.ts"),
        "@dating/core/appShell": path.resolve(process.cwd(), "../../packages/@dating/core/src/appShell.ts"),
        "@dating/core/i18nFactory": path.resolve(process.cwd(), "../../packages/@dating/core/src/i18nFactory.ts"),
        "@dating/ui": path.resolve(process.cwd(), "../../packages/@dating/ui/src"),
      },
    },
  })
}
