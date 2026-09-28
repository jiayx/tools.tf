import type { BgMode, IconMode } from './parse'

export type IconQueryState = {
  type: IconMode
  text: string
  icon: string
  fg: string
  bgMode: BgMode
  bg1: string
  bg2: string
  angle: number
  textGlyph: number
  iconGlyph: number
  radius: number
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
  params.set('textGlyph', String(state.textGlyph))
  params.set('iconGlyph', String(state.iconGlyph))
  params.set('radius', String(state.radius))
  if (state.type === 'text') {
    params.set('text', state.text)
  } else {
    params.set('icon', state.icon)
  }
  return params
}
