import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'

export default defineConfig(({ mode }) => ({
  plugins: mode === 'test' ? [react(), ssrPlugin()] : [cloudflare(), react(), ssrPlugin()],
  test: {
    environment: 'node',
  },
}))
