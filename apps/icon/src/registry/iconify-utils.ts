import type { IconifyJSON } from '@iconify/types'
import { createIconIndex } from '../icons/icon-index'

export const BASE_SIZE = 24
export const CDN_BASE = 'https://cdn.jsdelivr.net/npm'

export const fetchIconifyJson = async (pkg: string): Promise<IconifyJSON> => {
  const response = await fetch(`${CDN_BASE}/${pkg}/icons.json`)
  if (!response.ok) {
    throw new Error(`Failed to load ${pkg} icons`)
  }
  return (await response.json()) as IconifyJSON
}

export const normalizeIconBody = (body: string, width: number, height: number) => {
  if (!width || !height) return body
  const scale = Math.min(BASE_SIZE / width, BASE_SIZE / height)
  const offsetX = (BASE_SIZE - width * scale) / 2
  const offsetY = (BASE_SIZE - height * scale) / 2
  const x = offsetX.toFixed(3)
  const y = offsetY.toFixed(3)
  const s = scale.toFixed(5)
  return `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`
}

export const buildIndexFromJson = (json: IconifyJSON, normalizeToBase: boolean) => {
  const defaultWidth = json.width ?? BASE_SIZE
  const defaultHeight = json.height ?? BASE_SIZE
  const entries = Object.entries(json.icons).map(([name, svg]) => {
    const width = svg.width ?? defaultWidth
    const height = svg.height ?? defaultHeight
    const body = normalizeToBase ? normalizeIconBody(svg.body, width, height) : svg.body
    return [name, body] as const
  })
  return createIconIndex(entries)
}
