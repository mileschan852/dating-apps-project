import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/app-base/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.GITHUB_RUN_NUMBER || 'dev'),
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: /^@dating\/core(\/.+)?$/, replacement: path.resolve(__dirname, './src/dating-core$1') },
      { find: /^dating-core(\/.+)?$/, replacement: path.resolve(__dirname, './src/dating-core$1') },
      { find: '@dating/ui', replacement: path.resolve(__dirname, './src/dating-ui/index.ts') },
      { find: 'dating-ui', replacement: path.resolve(__dirname, './src/dating-ui/index.ts') },
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
