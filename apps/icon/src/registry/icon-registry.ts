import { lucideIconNames, getLucideIconMarkup } from '../icons/lucide'
import type { IconifyJSON } from '@iconify/types'
import { ICON_SET_META, type IconSetId, type IconSetData } from './icon-types'
import { buildIndexFromJson, fetchIconifyJson } from './iconify-utils'
export type { IconSetId } from './icon-types'
import { KVNamespace } from '@cloudflare/workers-types'

export const FALLBACK_ICON_MARKUP = '<circle cx="12" cy="12" r="9" />'

const KV_PREFIX = 'iconify:'
const KV_TTL_SECONDS = 60 * 60 * 24 * 7

export const loadIconSetData = async (iconSet: IconSetId, kv?: KVNamespace): Promise<IconSetData> => {
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
