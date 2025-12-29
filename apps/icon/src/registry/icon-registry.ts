import { lucideIconNames, getLucideIconMarkup } from '../icons/lucide'
import { createIconIndex } from '../icons/icon-index'
import type { IconifyJSON } from '@iconify/types'
import { ICON_SET_META, type IconSetId } from './icon-types'
export type { IconSetId } from './icon-types'
import { KVNamespace } from '@cloudflare/workers-types'

export const FALLBACK_ICON_MARKUP = '<circle cx="12" cy="12" r="9" />'

type IconSetData = {
  names: string[]
  getMarkup: (name: string) => string | undefined
}

const CDN_BASE = 'https://cdn.jsdelivr.net/npm'
const BASE_SIZE = 24
const KV_PREFIX = 'iconify:'
const KV_TTL_SECONDS = 60 * 60 * 24 * 7

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

export const loadIconSetData = async (iconSet: IconSetId, kv?: KVNamespace) => {
  if (iconSet === 'lucide') {
    return { names: lucideIconNames, getMarkup: getLucideIconMarkup }
  }

  const pkg = iconSet === 'tabler' ? '@iconify-json/tabler' : '@iconify-json/logos'
  let json: IconifyJSON | null = null

  if (kv) {
    try {
      json = await kv.get<IconifyJSON>(`${KV_PREFIX}${iconSet}`, 'json')
    } catch (error) {
      console.warn(error)
    }
  }

  try {
    if (!json) {
      json = await fetchIconifyJson(pkg)
      if (kv) {
        try {
          await kv.put(`${KV_PREFIX}${iconSet}`, JSON.stringify(json), {
            expirationTtl: KV_TTL_SECONDS,
          })
        } catch (error) {
          console.warn(error)
        }
      }
    }
    const normalizeToBase = iconSet === 'logos'
    const [names, getMarkup] = buildIndexFromJson(json, normalizeToBase)
    return { names, getMarkup }
  } catch (error) {
    console.warn(error)
    return { names: [], getMarkup: () => undefined }
  }
}

export const getIconWrapperAttributes = (iconSet: IconSetId, color: string) => {
  if (ICON_SET_META[iconSet].renderMode === 'stroke') {
    return `fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`
  }
  return `color="${color}"`
}
