type BackgroundOptions = {
  size: number
  bgMode: 'solid' | 'gradient' | 'transparent'
  bg1: string
  bg2: string
  angle: number
  radius: number
}

export const buildBackgroundParts = ({ size, bgMode, bg1, bg2, angle, radius }: BackgroundOptions) => {
  const gradientId = 'bg'
  const clipPathId = 'clip'
  const hasGradient = bgMode === 'gradient' && bg1 !== bg2
  const fill = hasGradient ? `url(#${gradientId})` : bg1
  const cornerRadius = (size * radius) / 100
  const defsParts: string[] = []
  if (hasGradient) {
    defsParts.push(
      `<linearGradient id="${gradientId}" gradientTransform="rotate(${angle} 0.5 0.5)"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient>`
    )
  }
  if (bgMode !== 'transparent') {
    defsParts.push(`<clipPath id="${clipPathId}"><rect width="${size}" height="${size}" rx="${cornerRadius}" /></clipPath>`)
  }
  const defs = defsParts.length > 0 ? `<defs>${defsParts.join('')}</defs>` : ''
  const backgroundMarkup =
    bgMode === 'transparent' ? '' : `<rect width="${size}" height="${size}" rx="${cornerRadius}" fill="${fill}" />`
  const clipPath = bgMode === 'transparent' ? '' : `clip-path="url(#${clipPathId})"`
  return { defs, backgroundMarkup, clipPath }
}

type IconSvgOptions = {
  size: number
  glyph?: number
  iconMarkup: string
  wrapper: string
  defs?: string
  backgroundMarkup?: string
  clipPath?: string
  includeXmlDeclaration?: boolean
}

export const buildIconSvg = ({
  size,
  glyph = 100,
  iconMarkup,
  wrapper,
  defs = '',
  backgroundMarkup = '',
  clipPath = '',
  includeXmlDeclaration = true,
}: IconSvgOptions) => {
  const glyphSize = (size * glyph) / 100
  const scale = glyphSize / 24
  const offset = (size - glyphSize) / 2
  const xml = includeXmlDeclaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : ''
  return `${xml}<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${defs}
  ${backgroundMarkup}
  <g ${clipPath}>
    <g transform="translate(${offset} ${offset}) scale(${scale})" ${wrapper}>
      ${iconMarkup}
    </g>
  </g>
</svg>`
}
