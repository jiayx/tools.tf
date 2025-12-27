export type IconIndex = [
  iconNames: string[],
  getIconMarkup: (name: string) => string | undefined
]

export const createIconIndex = (entries: Array<readonly [string, string]>): IconIndex => {
  const filtered = entries.filter(([name]) => Boolean(name))
  const iconMap = new Map(filtered)
  const iconNames = filtered
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b))

  return [
    iconNames,
    (name: string) => iconMap.get(name),
  ]
}
