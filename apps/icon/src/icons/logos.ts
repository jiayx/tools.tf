import icons from '@iconify-json/logos/icons.json'
import { buildIndexFromJson } from '../registry/iconify-utils'

export const [logosIconNames, getLogosIconMarkup] = buildIndexFromJson(icons, true)
