import iconNodes from 'lucide-static/icon-nodes.json';

const extractInnerSvg = (iconData: any) => {
  return iconData.map(([tag, attrs]: [string, Record<string, string>]) => {
    const attrString = Object.entries(attrs)
        .map(([key, val]) => `${key}="${val}"`)
        .join(" ");
        return `<${tag} ${attrString} />`;
  }).join(" ");
}

const iconEntries = Object.entries(iconNodes)
  .map(([path, svg]) => {

    const name = path.split('/').pop()?.replace('.svg', '') ?? ''
    return [name, extractInnerSvg(svg)] as const
  })
  .filter(([name]) => Boolean(name))

const iconMap = new Map(iconEntries)

export const iconNames = iconEntries
  .map(([name]) => name)
  .sort((a, b) => a.localeCompare(b))

export const getLucideIconMarkup = (name: string) => iconMap.get(name)
