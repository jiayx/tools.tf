import { lucideIconNames, getLucideIconMarkup } from '../icons/lucide'
import type { IconifyJSON } from '@iconify/types'
import type { IconSetId, IconSetData } from './icon-types'
import { buildIndexFromJson, fetchIconifyJson, ICONIFY_PACKAGES } from './iconify-utils'
import type { KVNamespace } from '@cloudflare/workers-types'

const KV_PREFIX = 'iconify:'
const KV_TTL_SECONDS = 60 * 60 * 24 * 7
type Defer = (promise: Promise<unknown>) => void

export const loadIconSetData = async (
  iconSet: IconSetId,
  kv?: KVNamespace,
  defer?: Defer,
): Promise<IconSetData> => {
  if (iconSet === 'lucide') {
    return { names: lucideIconNames, getMarkup: getLucideIconMarkup }
  }

  const pkg = ICONIFY_PACKAGES[iconSet]
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
        const write = kv.put(`${KV_PREFIX}${iconSet}`, JSON.stringify(json), {
          expirationTtl: KV_TTL_SECONDS,
        }).catch((error) => {
          console.warn(error)
        })

        if (defer) {
          defer(write)
        } else {
          await write
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
