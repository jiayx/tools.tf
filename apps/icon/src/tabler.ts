import icons from '@iconify-json/tabler/icons.json'
import { createIconIndex } from './icon-index'

const iconEntries = Object.entries(icons.icons)
  .map(([name, svg]) => {
    return [name, svg.body] as const
  })

export const [ tablerIconNames, getTablerIconMarkup ] = createIconIndex(iconEntries)
