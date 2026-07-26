/** @jsxImportSource react */
import '@vitejs/plugin-react/preamble'
import { browserLocale, localeTag } from '@tools/i18n'
import { createRoot } from 'react-dom/client'
import { QrApp } from './App'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container not found')
}

document.documentElement.lang = localeTag(browserLocale())
createRoot(container).render(<QrApp />)
