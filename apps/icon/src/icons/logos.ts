import rawIcons from '@iconify-json/logos/icons.json'
import { createIconIndex } from './icon-index'
import type { IconifyJSON } from '@iconify/types'

const icons = rawIcons as IconifyJSON

const BASE_SIZE = 24
const defaultWidth = icons.width ?? BASE_SIZE
const defaultHeight = icons.height ?? BASE_SIZE

const normalizeIconBody = (body: string, width: number, height: number) => {
  if (!width || !height) return body
  const scale = Math.min(BASE_SIZE / width, BASE_SIZE / height)
  const offsetX = (BASE_SIZE - width * scale) / 2
  const offsetY = (BASE_SIZE - height * scale) / 2
  const x = offsetX.toFixed(3)
  const y = offsetY.toFixed(3)
  const s = scale.toFixed(5)
  return `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`
}

const iconEntries = Object.entries(icons.icons).map(([name, svg]) => {
  const width = svg.width ?? defaultWidth
  const height = svg.height ?? defaultHeight
  return [name, normalizeIconBody(svg.body, width, height)] as const
})

export const [logosIconNames, getLogosIconMarkup] = createIconIndex(iconEntries)
