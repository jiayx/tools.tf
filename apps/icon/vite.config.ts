import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'

export default defineConfig({
  plugins: [cloudflare(), ssrPlugin()],
  environments: {
    client: {
      build: {
        rolldownOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('lucide-static')) return 'lucide-icons'
              if (id.includes('@iconify-json/tabler')) return 'tabler-icons'
              if (id.includes('@iconify-json/logos')) return 'logos-icons'
            }
          }
        }
      }
    }
  },
})
