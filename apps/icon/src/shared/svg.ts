type BackgroundOptions = {
  size: number
  bgMode: 'solid' | 'gradient' | 'transparent'
  bg1: string
  bg2: string
  angle: number
}

export const buildBackgroundParts = ({ size, bgMode, bg1, bg2, angle }: BackgroundOptions) => {
  const gradientId = 'bg'
  const hasGradient = bgMode === 'gradient' && bg1 !== bg2
  const defs = hasGradient
    ? `<defs><linearGradient id="${gradientId}" gradientTransform="rotate(${angle} 0.5 0.5)"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>`
    : ''
  const fill = hasGradient ? `url(#${gradientId})` : bg1
  const radius = size * 0.22
  const backgroundMarkup =
    bgMode === 'transparent' ? '' : `<rect width="${size}" height="${size}" rx="${radius}" fill="${fill}" />`
  return { defs, backgroundMarkup }
}

type IconSvgOptions = {
  size: number
  glyph?: number
  iconMarkup: string
  wrapper: string
  defs?: string
  backgroundMarkup?: string
  includeXmlDeclaration?: boolean
}

export const buildIconSvg = ({
  size,
  glyph = 100,
  iconMarkup,
  wrapper,
  defs = '',
  backgroundMarkup = '',
  includeXmlDeclaration = true,
}: IconSvgOptions) => {
  const glyphSize = (size * glyph) / 100
  const scale = glyphSize / 24
  const offset = (size - glyphSize) / 2
  const xml = includeXmlDeclaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : ''
  return `${xml}<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${defs}
  ${backgroundMarkup}
  <g transform="translate(${offset} ${offset}) scale(${scale})" ${wrapper}>
    ${iconMarkup}
  </g>
</svg>`
}
