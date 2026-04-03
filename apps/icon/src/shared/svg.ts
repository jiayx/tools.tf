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

const isWideGlyph = (char: string) =>
  /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF01-\uFF60\uFFE0-\uFFE6]/.test(
    char
  )

const measureTextUnits = (text: string) => {
  let units = 0
  for (const char of text) {
    if (isWideGlyph(char)) {
      units += 1
    } else if (/[A-Z]/.test(char)) {
      units += 0.72
    } else if (/[a-z]/.test(char)) {
      units += 0.56
    } else if (/[0-9A-Za-z]/.test(char)) {
      units += 0.62
    } else if (/[\-_.]/.test(char)) {
      units += 0.36
    } else {
      units += 0.8
    }
  }
  return Math.max(units, 1)
}

const hasWideGlyph = (text: string) => {
  for (const char of text) {
    if (isWideGlyph(char)) return true
  }
  return false
}

const escapeSvgText = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

type TextSvgOptions = {
  size: number
  glyph: number
  text: string
  fg: string
  defs?: string
  backgroundMarkup?: string
  clipPath?: string
  includeXmlDeclaration?: boolean
}

export const buildTextSvg = ({
  size,
  glyph,
  text,
  fg,
  defs = '',
  backgroundMarkup = '',
  clipPath = '',
  includeXmlDeclaration = true,
}: TextSvgOptions) => {
  const textUnits = measureTextUnits(text)
  const isWide = hasWideGlyph(text)
  const charCount = text.length || 1
  const letterSpacingEm = charCount >= 6 ? 0.004 : charCount >= 4 ? 0.01 : 0.02
  const spacingUnits = Math.max(charCount - 1, 0) * letterSpacingEm
  const totalWidthUnits = textUnits + spacingUnits
  const horizontalPadding = size * (charCount >= 5 ? 0.08 : 0.1)
  const verticalPadding = size * (isWide ? 0.16 : 0.18)
  const targetWidth = size - horizontalPadding * 2
  const targetHeight = size - verticalPadding * 2
  const fittedWidth = targetWidth / totalWidthUnits
  const heightFactor = isWide ? 1 : 0.78
  const fittedHeight = targetHeight / heightFactor
  const minGlyph = 1
  const maxGlyph = 100
  const minFontSize = size * (charCount >= 6 ? 0.1 : charCount >= 4 ? 0.14 : 0.18)
  const maxFontSize = Math.max(Math.min(fittedWidth, fittedHeight), minFontSize)
  const glyphProgress = Math.min(Math.max((glyph - minGlyph) / (maxGlyph - minGlyph), 0), 1)
  const fontSize = minFontSize + (maxFontSize - minFontSize) * glyphProgress
  const fontFamily =
    'Arial, Helvetica Neue, Helvetica, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC, sans-serif'
  const letterSpacing = `${letterSpacingEm}em`
  const safeText = escapeSvgText(text)
  const xml = includeXmlDeclaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : ''
  return `${xml}<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${defs}
  ${backgroundMarkup}
  <g ${clipPath}>
    <text x="50%" y="50%" fill="${fg}" font-family='${fontFamily}' font-size="${fontSize}" font-weight="600" text-anchor="middle" dominant-baseline="central" letter-spacing="${letterSpacing}">${safeText}</text>
  </g>
</svg>`
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
