export type IconSetId = 'lucide' | 'tabler' | 'logos'

export type IconRenderMode = 'stroke' | 'currentColor'

export type IconSetMeta = {
  id: IconSetId
  label: string
  defaultIcon: string
  renderMode: IconRenderMode
}

export type IconSetData = {
  names: string[]
  getMarkup: (name: string) => string | undefined
}

export const ICON_SET_META: Record<IconSetId, IconSetMeta> = {
  lucide: {
    id: 'lucide',
    label: 'Lucide',
    defaultIcon: 'sparkles',
    renderMode: 'stroke',
  },
  tabler: {
    id: 'tabler',
    label: 'Tabler',
    defaultIcon: 'star',
    renderMode: 'currentColor',
  },
  logos: {
    id: 'logos',
    label: 'Logos',
    defaultIcon: 'google-gmail',
    renderMode: 'currentColor',
  },
}
