import type {
  CornerDotType,
  CornerSquareType,
  DotType,
  ErrorCorrectionLevel,
  GradientType,
  Options,
} from 'qr-code-styling-worker'

const DEFAULT_DATA = 'https://tools.tf'
const DEFAULT_SIZE = 320
const DEFAULT_MARGIN = 16
const DEFAULT_FG = '#2563eb'
const DEFAULT_BG = '#ffffff'
const DEFAULT_ERROR_LEVEL = 'M'

export interface QrConfig {
  data: string
  dotType: DotType
  cornerSquareType: CornerSquareType
  cornerDotType: CornerDotType
  fgColor: string
  useGradient: boolean
  gradientColor1: string
  gradientColor2: string
  gradientType: GradientType
  bgColor: string
  transparentBg: boolean
  errorLevel: ErrorCorrectionLevel
  logoUrl: string
  margin: number
}

export interface QrImageOptions extends QrConfig {
  size: number
}

export const DEFAULT_CONFIG: QrConfig = {
  data: DEFAULT_DATA,
  dotType: 'rounded',
  cornerSquareType: 'extra-rounded',
  cornerDotType: 'dot',
  fgColor: DEFAULT_FG,
  useGradient: true,
  gradientColor1: '#2563eb',
  gradientColor2: '#06b6d4',
  gradientType: 'linear',
  bgColor: DEFAULT_BG,
  transparentBg: false,
  errorLevel: 'M',
  logoUrl: '',
  margin: DEFAULT_MARGIN,
}

function clampNumber(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function parseBoolean(value: string | null) {
  if (!value) return false
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function parseColor(value: string | null, fallback: string) {
  if (!value) return fallback
  const normalized = value.startsWith('#') ? value : `#${value}`

  if (/^#[0-9a-fA-F]{3,8}$/.test(normalized)) {
    return normalized
  }

  return fallback
}

function parseErrorLevel(value: string | null): ErrorCorrectionLevel {
  switch (value?.toUpperCase()) {
    case 'L':
    case 'M':
    case 'Q':
    case 'H':
      return value.toUpperCase() as ErrorCorrectionLevel
    default:
      return DEFAULT_ERROR_LEVEL
  }
}

function parseDotType(value: string | null): DotType {
  switch (value) {
    case 'square':
    case 'dots':
    case 'rounded':
    case 'classy':
    case 'classy-rounded':
    case 'extra-rounded':
      return value
    default:
      return DEFAULT_CONFIG.dotType
  }
}

function parseCornerSquareType(value: string | null): CornerSquareType {
  switch (value) {
    case 'square':
    case 'dot':
    case 'extra-rounded':
      return value
    default:
      return DEFAULT_CONFIG.cornerSquareType
  }
}

function parseCornerDotType(value: string | null): CornerDotType {
  switch (value) {
    case 'square':
    case 'dot':
      return value
    default:
      return DEFAULT_CONFIG.cornerDotType
  }
}

function parseGradientType(value: string | null): GradientType {
  return value === 'radial' ? 'radial' : 'linear'
}

export function parseQrImageOptions(searchParams: URLSearchParams): QrImageOptions {
  return {
    data: searchParams.get('data') || DEFAULT_DATA,
    size: clampNumber(searchParams.get('size'), DEFAULT_SIZE, 128, 2048),
    margin: clampNumber(searchParams.get('margin'), DEFAULT_MARGIN, 0, 128),
    dotType: parseDotType(searchParams.get('dotType') || searchParams.get('dot')),
    cornerSquareType: parseCornerSquareType(searchParams.get('cornerSquareType') || searchParams.get('cornerSquare')),
    cornerDotType: parseCornerDotType(searchParams.get('cornerDotType') || searchParams.get('cornerDot')),
    fgColor: parseColor(searchParams.get('fg') || searchParams.get('color'), DEFAULT_FG),
    useGradient: parseBoolean(searchParams.get('gradient')),
    gradientColor1: parseColor(searchParams.get('gradientColor1') || searchParams.get('fg') || searchParams.get('color'), DEFAULT_CONFIG.gradientColor1),
    gradientColor2: parseColor(searchParams.get('gradientColor2'), DEFAULT_CONFIG.gradientColor2),
    gradientType: parseGradientType(searchParams.get('gradientType')),
    bgColor: parseColor(searchParams.get('bg'), DEFAULT_BG),
    transparentBg: parseBoolean(searchParams.get('transparent')),
    errorLevel: parseErrorLevel(searchParams.get('ecl') || searchParams.get('errorLevel')),
    logoUrl: searchParams.get('logo') || searchParams.get('logoUrl') || '',
  }
}

export function buildQrCodeStylingOptions(config: QrImageOptions): Partial<Options> {
  const gradient = config.useGradient
    ? {
        type: config.gradientType,
        rotation: 45,
        colorStops: [
          { offset: 0, color: config.gradientColor1 },
          { offset: 1, color: config.gradientColor2 },
        ],
      }
    : undefined

  return {
    type: 'svg',
    width: config.size,
    height: config.size,
    margin: config.margin,
    data: config.data,
    image: config.logoUrl || undefined,
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 6,
      imageSize: 0.3,
      saveAsBlob: true,
    },
    qrOptions: {
      errorCorrectionLevel: config.errorLevel,
    },
    dotsOptions: {
      type: config.dotType,
      color: config.fgColor,
      gradient,
      roundSize: false,
    },
    cornersSquareOptions: {
      type: config.cornerSquareType,
      color: config.fgColor,
      gradient,
    },
    cornersDotOptions: {
      type: config.cornerDotType,
      color: config.fgColor,
      gradient,
    },
    backgroundOptions: {
      color: config.transparentBg ? 'rgba(0,0,0,0)' : config.bgColor,
    },
  }
}

function serializeColor(value: string) {
  return value.startsWith('#') ? value.slice(1) : value
}

export function buildQrImageQuery(config: QrImageOptions): string {
  const searchParams = new URLSearchParams()

  searchParams.set('data', config.data)
  searchParams.set('size', String(config.size))
  searchParams.set('margin', String(config.margin))
  searchParams.set('dotType', config.dotType)
  searchParams.set('cornerSquareType', config.cornerSquareType)
  searchParams.set('cornerDotType', config.cornerDotType)
  searchParams.set('fg', serializeColor(config.fgColor))
  searchParams.set('bg', serializeColor(config.bgColor))
  searchParams.set('ecl', config.errorLevel)

  if (config.useGradient) {
    searchParams.set('gradient', '1')
    searchParams.set('gradientColor1', serializeColor(config.gradientColor1))
    searchParams.set('gradientColor2', serializeColor(config.gradientColor2))
    searchParams.set('gradientType', config.gradientType)
  }

  if (config.transparentBg) {
    searchParams.set('transparent', '1')
  }

  if (config.logoUrl) {
    searchParams.set('logo', config.logoUrl)
  }

  return searchParams.toString()
}
