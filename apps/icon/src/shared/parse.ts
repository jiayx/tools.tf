import type { IconSetId } from '../registry/icon-types'

const ALLOWED_TYPES = ['text', 'lucide', 'tabler', 'logos'] as const
const ALLOWED_BG_MODES = ['solid', 'gradient', 'transparent'] as const

export type IconMode = 'text' | IconSetId
export type BgMode = (typeof ALLOWED_BG_MODES)[number]

export const parseIconMode = (value?: string): IconMode => {
  const raw = (value || '').toLowerCase()
  return (ALLOWED_TYPES as readonly string[]).includes(raw) ? (raw as IconMode) : 'text'
}

export const parseBgMode = (value?: string): BgMode => {
  const raw = (value || '').toLowerCase()
  return (ALLOWED_BG_MODES as readonly string[]).includes(raw)
    ? (raw as BgMode)
    : 'solid'
}

export const resolveIconSet = (mode: IconMode): IconSetId =>
  mode === 'tabler' ? 'tabler' : mode === 'logos' ? 'logos' : 'lucide'
