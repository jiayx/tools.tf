import { lucideIconNames, getLucideIconMarkup } from '../icons/lucide'
import { tablerIconNames, getTablerIconMarkup } from '../icons/tabler'
import { logosIconNames, getLogosIconMarkup } from '../icons/logos'
import { ICON_SET_META, type IconSetId } from './icon-types'
export type { IconSetId } from './icon-types'

export const FALLBACK_ICON_MARKUP = '<circle cx="12" cy="12" r="9" />'

export const ICON_SETS = {
  lucide: {
    ...ICON_SET_META.lucide,
    names: lucideIconNames,
    getMarkup: getLucideIconMarkup,
  },
  tabler: {
    ...ICON_SET_META.tabler,
    names: tablerIconNames,
    getMarkup: getTablerIconMarkup,
  },
  logos: {
    ...ICON_SET_META.logos,
    names: logosIconNames,
    getMarkup: getLogosIconMarkup,
  },
} as const

export type IconSet = (typeof ICON_SETS)[IconSetId]

export const ICON_SET_LIST: IconSet[] = Object.values(ICON_SETS)

export const resolveIconSet = (value?: string): IconSetId => {
  if (value && value in ICON_SETS) return value as IconSetId
  return 'lucide'
}

export const normalizeIconName = (iconSet: IconSetId, value: string | undefined, fallback: string) => {
  if (!value) return fallback
  const normalized = value.trim().toLowerCase()
  return ICON_SETS[iconSet].names.includes(normalized) ? normalized : fallback
}

export const getIconMarkup = (iconSet: IconSetId, name: string) => ICON_SETS[iconSet].getMarkup(name)

export const getIconWrapperAttributes = (iconSet: IconSetId, color: string) => {
  if (ICON_SETS[iconSet].renderMode === 'stroke') {
    return `fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`
  }
  return `color="${color}"`
}

export const buildIconPreviewSvg = (iconSet: IconSetId, name: string, color: string, size: number) => {
  const iconMarkup = getIconMarkup(iconSet, name) ?? FALLBACK_ICON_MARKUP
  const wrapper = getIconWrapperAttributes(iconSet, color)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <g ${wrapper}>
    ${iconMarkup}
  </g>
</svg>`
}
