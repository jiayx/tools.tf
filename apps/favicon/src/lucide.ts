import iconNodes from 'lucide-static/icon-nodes.json'
import { createIconIndex } from './icon-index'

const extractInnerSvg = (iconData: any) => {
  return iconData.map(([tag, attrs]: [string, Record<string, string>]) => {
    const attrString = Object.entries(attrs)
        .map(([key, val]) => `${key}="${val}"`)
        .join(" ");
        return `<${tag} ${attrString} />`;
  }).join(" ");
}

const iconEntries = Object.entries(iconNodes)
  .map(([name, svg]) => {
    return [name, extractInnerSvg(svg)] as const
  })

const { iconNames, getIconMarkup } = createIconIndex(iconEntries)

export { iconNames }
export const getLucideIconMarkup = getIconMarkup
