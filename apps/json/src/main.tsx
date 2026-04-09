/** @jsxImportSource react */
import '@vitejs/plugin-react/preamble'
import { createRoot } from 'react-dom/client'
import { JsonApp } from './App'

const container = document.getElementById('root')
if (!container) throw new Error('Root container not found')

createRoot(container).render(<JsonApp />)
