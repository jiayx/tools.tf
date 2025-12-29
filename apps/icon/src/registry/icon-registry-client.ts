import type { IconRenderMode, IconSetId, IconSetData } from './icon-types'
import { ICON_SET_META } from './icon-types'
import type { IconifyJSON } from '@iconify/types'
import { buildIndexFromJson, fetchIconifyJson } from './iconify-utils'

const CDN_ONLY = import.meta.env.VITE_ICONIFY_CDN_ONLY === 'true'

const loaders: Record<IconSetId, () => Promise<IconSetData>> = {
  lucide: async () => {
    const mod = await import('../icons/lucide')
    return { names: mod.lucideIconNames, getMarkup: mod.getLucideIconMarkup }
  },
  tabler: async () => {
    try {
      const json = await fetchIconifyJson('@iconify-json/tabler')
      const [names, getMarkup] = buildIndexFromJson(json, false)
      return { names, getMarkup }
    } catch (error) {
      console.warn(error)
      if (CDN_ONLY) {
        return { names: [], getMarkup: () => undefined }
      }
      const mod = await import('../icons/tabler')
      return { names: mod.tablerIconNames, getMarkup: mod.getTablerIconMarkup }
    }
  },
  logos: async () => {
    try {
      const json = await fetchIconifyJson('@iconify-json/logos')
      const [names, getMarkup] = buildIndexFromJson(json, true)
      return { names, getMarkup }
    } catch (error) {
      console.warn(error)
      if (CDN_ONLY) {
        return { names: [], getMarkup: () => undefined }
      }
      const mod = await import('../icons/logos')
      return { names: mod.logosIconNames, getMarkup: mod.getLogosIconMarkup }
    }
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
