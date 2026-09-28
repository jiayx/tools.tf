import type { IconSetId, IconSetData } from './icon-types'
import { buildIndexFromJson, fetchIconifyJson, ICONIFY_PACKAGES } from './iconify-utils'

const CDN_ONLY = import.meta.env.VITE_ICONIFY_CDN_ONLY === 'true'

async function fetchIconSet(iconSet: IconSetId): Promise<IconSetData> {
  if (iconSet === 'lucide') {
    const mod = await import('../icons/lucide')
    return { names: mod.lucideIconNames, getMarkup: mod.getLucideIconMarkup }
  }

  try {
    const json = await fetchIconifyJson(ICONIFY_PACKAGES[iconSet])
    const [names, getMarkup] = buildIndexFromJson(json, iconSet === 'logos')
    return { names, getMarkup }
  } catch (error) {
    console.warn(error)
    if (CDN_ONLY) return { names: [], getMarkup: () => undefined }
    if (iconSet === 'tabler') {
      const mod = await import('../icons/tabler')
      return { names: mod.tablerIconNames, getMarkup: mod.getTablerIconMarkup }
    }
    const mod = await import('../icons/logos')
    return { names: mod.logosIconNames, getMarkup: mod.getLogosIconMarkup }
  }
}

const cache = new Map<IconSetId, IconSetData>()
const inflight = new Map<IconSetId, Promise<IconSetData>>()

export const loadIconSet = async (iconSet: IconSetId) => {
  const cached = cache.get(iconSet)
  if (cached) return cached
  const loading = inflight.get(iconSet)
  if (loading) return loading
  const promise = fetchIconSet(iconSet).then((data) => {
    cache.set(iconSet, data)
    inflight.delete(iconSet)
    return data
  })
  inflight.set(iconSet, promise)
  return promise
}

export const getIconSetData = (iconSet: IconSetId) => cache.get(iconSet) ?? null
