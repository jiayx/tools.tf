import { describe, expect, it } from 'vitest'
import { buildIconQuery, parseIconQuery } from './query'
import { buildTextSvg } from './svg'

describe('icon query helpers', () => {
  it('normalizes unsupported modes', () => {
    expect(parseIconQuery({ type: 'unknown', bg: 'invalid' })).toMatchObject({
      type: 'text',
      bgMode: 'solid',
    })
  })

  it('round-trips a complete icon query', () => {
    const state = {
      type: 'tabler' as const,
      text: '',
      icon: 'icons',
      fg: '#ffffff',
      bgMode: 'gradient' as const,
      bg1: '#111827',
      bg2: '#6366f1',
      angle: 140,
      textGlyph: 80,
      iconGlyph: 64,
      radius: 22,
    }

    expect(Object.fromEntries(buildIconQuery(state))).toEqual({
      type: 'tabler',
      fg: '#ffffff',
      bg: 'gradient',
      bg1: '#111827',
      bg2: '#6366f1',
      angle: '140',
      textGlyph: '80',
      iconGlyph: '64',
      radius: '22',
      icon: 'icons',
    })
  })
})

describe('text SVG', () => {
  it('escapes user-provided text', () => {
    const svg = buildTextSvg({
      size: 64,
      glyph: 80,
      text: '<&>',
      fg: '#ffffff',
    })

    expect(svg).toContain('&lt;&amp;&gt;')
    expect(svg).not.toContain('<&>')
  })
})
