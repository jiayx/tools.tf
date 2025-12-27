import icons from '@iconify-json/tabler/icons.json'
import { createIconIndex } from './icon-index'

const iconEntries = Object.entries(icons.icons)
  .map(([name, svg]) => {
    return [name, svg.body] as const
  })

const { iconNames, getIconMarkup } = createIconIndex(iconEntries)

export { iconNames }
export const getTablerIconMarkup = getIconMarkup
