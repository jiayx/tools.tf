import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'

export default defineConfig(({ mode }) => ({
  plugins: mode === 'test' ? [ssrPlugin()] : [cloudflare(), ssrPlugin()],
  test: {
    environment: 'node',
  },
}))
