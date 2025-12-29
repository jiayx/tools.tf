import type { BgMode, IconMode } from './parse'
import { parseBgMode, parseIconMode } from './parse'

export type IconQueryState = {
  type: IconMode
  text: string
  icon: string
  fg: string
  bgMode: BgMode
  bg1: string
  bg2: string
  angle: number
  glyph: number
}

export const parseIconQuery = (query: Record<string, string>): IconQueryState => {
  return {
    type: parseIconMode(query.type),
    text: query.text || '',
    icon: query.icon || '',
    fg: query.fg || '',
    bgMode: parseBgMode(query.bg),
    bg1: query.bg1 || '',
    bg2: query.bg2 || '',
    angle: Number(query.angle || 0),
    glyph: Number(query.glyph || 0),
  }
}

export const buildIconQuery = (state: IconQueryState) => {
  const params = new URLSearchParams()
  params.set('type', state.type)
  params.set('fg', state.fg)
  params.set('bg', state.bgMode)
  if (state.bgMode !== 'transparent') {
    params.set('bg1', state.bg1)
  }
  if (state.bgMode === 'gradient') {
    params.set('bg2', state.bg2)
    params.set('angle', String(state.angle))
  }
  params.set('glyph', String(state.glyph))
  if (state.type === 'text') {
    params.set('text', state.text)
  } else {
    params.set('icon', state.icon)
  }
  return params
}
