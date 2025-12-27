export type Preset = {
  key: string
  label: string
  fg: string
  bg1: string
  bg2: string
  angle: number
  bgMode: 'solid' | 'gradient'
}

export const DEFAULTS = {
  type: 'text',
  text: 'TF',
  icon: 'sparkles',
  fg: '#f8fafc',
  bg1: '#111827',
  bg2: '#6366f1',
  angle: 140,
  size: 128,
  glyph: 64,
}

export const PRESETS: Preset[] = [
  {
    key: 'default',
    label: 'Default',
    fg: DEFAULTS.fg,
    bg1: DEFAULTS.bg1,
    bg2: DEFAULTS.bg2,
    angle: DEFAULTS.angle,
    bgMode: DEFAULTS.bg1 === DEFAULTS.bg2 ? 'solid' : 'gradient',
  },
  {
    key: 'midnight',
    label: 'Midnight',
    fg: '#f8fafc',
    bg1: '#0f172a',
    bg2: '#38bdf8',
    angle: 145,
    bgMode: 'gradient',
  },
  {
    key: 'citrus',
    label: 'Citrus',
    fg: '#7c2d12',
    bg1: '#fef3c7',
    bg2: '#fb7185',
    angle: 130,
    bgMode: 'gradient',
  },
  {
    key: 'pearl',
    label: 'Pearl',
    fg: '#0f172a',
    bg1: '#f8f5f2',
    bg2: '#f8f5f2',
    angle: 0,
    bgMode: 'solid',
  },
  {
    key: 'evergreen',
    label: 'Evergreen',
    fg: '#ecfeff',
    bg1: '#065f46',
    bg2: '#10b981',
    angle: 150,
    bgMode: 'gradient',
  },
  {
    key: 'carbon',
    label: 'Carbon',
    fg: '#f8fafc',
    bg1: '#111827',
    bg2: '#111827',
    angle: 0,
    bgMode: 'solid',
  },
  {
    key: 'azure',
    label: 'Azure',
    fg: '#1e3a8a',
    bg1: '#dbeafe',
    bg2: '#60a5fa',
    angle: 120,
    bgMode: 'gradient',
  },
]
