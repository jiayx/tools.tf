import type { IconRenderMode, IconSetId } from './icon-types'
import { ICON_SET_META } from './icon-types'

type IconSetData = {
  names: string[]
  getMarkup: (name: string) => string | undefined
}

const loaders: Record<IconSetId, () => Promise<IconSetData>> = {
  lucide: async () => {
    const mod = await import('./lucide')
    return { names: mod.lucideIconNames, getMarkup: mod.getLucideIconMarkup }
  },
  tabler: async () => {
    const mod = await import('./tabler')
    return { names: mod.tablerIconNames, getMarkup: mod.getTablerIconMarkup }
  },
  logos: async () => {
    const mod = await import('./logos')
    return { names: mod.logosIconNames, getMarkup: mod.getLogosIconMarkup }
  },
}

const cache = new Map<IconSetId, IconSetData>()
const inflight = new Map<IconSetId, Promise<IconSetData>>()

export const loadIconSet = async (iconSet: IconSetId) => {
  const cached = cache.get(iconSet)
  if (cached) return cached
  const loading = inflight.get(iconSet)
  if (loading) return loading
  const promise = loaders[iconSet]().then((data) => {
    cache.set(iconSet, data)
    inflight.delete(iconSet)
    return data
  })
  inflight.set(iconSet, promise)
  return promise
}

export const getIconSetData = (iconSet: IconSetId) => cache.get(iconSet) ?? null

export const getIconWrapperAttributes = (renderMode: IconRenderMode, color: string) => {
  if (renderMode === 'stroke') {
    return `fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`
  }
  return `color="${color}"`
}

export { ICON_SET_META }
