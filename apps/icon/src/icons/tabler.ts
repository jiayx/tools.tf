import icons from '@iconify-json/tabler/icons.json'
import { buildIndexFromJson } from '../registry/iconify-utils'

export const [tablerIconNames, getTablerIconMarkup] = buildIndexFromJson(icons, false)
