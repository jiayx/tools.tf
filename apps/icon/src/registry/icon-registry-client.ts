import type { IconRenderMode, IconSetId } from './icon-types'
import { ICON_SET_META } from './icon-types'
import { createIconIndex } from '../icons/icon-index'
import type { IconifyJSON } from '@iconify/types'

type IconSetData = {
  names: string[]
  getMarkup: (name: string) => string | undefined
}

const CDN_BASE = 'https://cdn.jsdelivr.net/npm'
const CDN_ONLY = import.meta.env.VITE_ICONIFY_CDN_ONLY === 'true'
const BASE_SIZE = 24

const fetchIconifyJson = async (pkg: string): Promise<IconifyJSON> => {
  const response = await fetch(`${CDN_BASE}/${pkg}/icons.json`)
  if (!response.ok) {
    throw new Error(`Failed to load ${pkg} icons`)
  }
  return (await response.json()) as IconifyJSON
}

const normalizeIconBody = (body: string, width: number, height: number) => {
  if (!width || !height) return body
  const scale = Math.min(BASE_SIZE / width, BASE_SIZE / height)
  const offsetX = (BASE_SIZE - width * scale) / 2
  const offsetY = (BASE_SIZE - height * scale) / 2
  const x = offsetX.toFixed(3)
  const y = offsetY.toFixed(3)
  const s = scale.toFixed(5)
  return `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`
}

const buildIndexFromJson = (json: IconifyJSON, normalizeToBase: boolean) => {
  const defaultWidth = json.width ?? BASE_SIZE
  const defaultHeight = json.height ?? BASE_SIZE
  const entries = Object.entries(json.icons).map(([name, svg]) => {
    const width = svg.width ?? defaultWidth
    const height = svg.height ?? defaultHeight
    const body = normalizeToBase ? normalizeIconBody(svg.body, width, height) : svg.body
    return [name, body] as const
  })
  return createIconIndex(entries)
}

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
