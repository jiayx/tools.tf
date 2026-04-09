/** @jsxImportSource react */
import QRCodeStyling, {
  type CornerDotType,
  type CornerSquareType,
  type DotType,
  type ErrorCorrectionLevel,
} from 'qr-code-styling'
import { useEffect, useRef, useState } from 'react'

type GradientType = 'linear' | 'radial'

interface QrConfig {
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

interface Preset {
  label: string
  color: string
  config: Partial<QrConfig>
}

const PRESETS: Preset[] = [
  {
    label: 'Classic',
    color: '#111827',
    config: {
      dotType: 'square',
      cornerSquareType: 'square',
      cornerDotType: 'square',
      fgColor: '#111827',
      useGradient: false,
      bgColor: '#ffffff',
      transparentBg: false,
    },
  },
  {
    label: 'Ocean',
    color: '#2563eb',
    config: {
      dotType: 'rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      useGradient: true,
      gradientColor1: '#2563eb',
      gradientColor2: '#06b6d4',
      gradientType: 'linear',
      bgColor: '#ffffff',
      transparentBg: false,
    },
  },
  {
    label: 'Sunset',
    color: '#f97316',
    config: {
      dotType: 'classy-rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      useGradient: true,
      gradientColor1: '#f97316',
      gradientColor2: '#dc2626',
      gradientType: 'linear',
      bgColor: '#fff7ed',
      transparentBg: false,
    },
  },
  {
    label: 'Forest',
    color: '#16a34a',
    config: {
      dotType: 'classy',
      cornerSquareType: 'square',
      cornerDotType: 'square',
      useGradient: true,
      gradientColor1: '#16a34a',
      gradientColor2: '#065f46',
      gradientType: 'linear',
      bgColor: '#f0fdf4',
      transparentBg: false,
    },
  },
  {
    label: 'Candy',
    color: '#a855f7',
    config: {
      dotType: 'dots',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      useGradient: true,
      gradientColor1: '#a855f7',
      gradientColor2: '#ec4899',
      gradientType: 'radial',
      bgColor: '#fdf4ff',
      transparentBg: false,
    },
  },
  {
    label: 'Moss',
    color: '#4d7c0f',
    config: {
      dotType: 'classy',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'square',
      useGradient: true,
      gradientColor1: '#65a30d',
      gradientColor2: '#365314',
      gradientType: 'linear',
      bgColor: '#f7fee7',
      transparentBg: false,
    },
  },
  {
    label: 'Amber',
    color: '#d97706',
    config: {
      dotType: 'classy-rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'square',
      useGradient: true,
      gradientColor1: '#f59e0b',
      gradientColor2: '#b45309',
      gradientType: 'radial',
      bgColor: '#fffbeb',
      transparentBg: false,
    },
  },
  {
    label: 'Rouge',
    color: '#9f1239',
    config: {
      dotType: 'classy',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'square',
      useGradient: true,
      gradientColor1: '#9f1239',
      gradientColor2: '#e11d48',
      gradientType: 'radial',
      bgColor: '#fff8f1',
      transparentBg: false,
    },
  },
]

const DOT_TYPES: { label: string; value: DotType }[] = [
  { label: '方形', value: 'square' },
  { label: '圆形', value: 'dots' },
  { label: '圆角', value: 'rounded' },
  { label: '优雅', value: 'classy' },
  { label: '优雅圆角', value: 'classy-rounded' },
  { label: '菱形', value: 'extra-rounded' },
]

const CORNER_SQUARE_TYPES: { label: string; value: CornerSquareType }[] = [
  { label: '方形', value: 'square' },
  { label: '点形', value: 'dot' },
  { label: '大圆角', value: 'extra-rounded' },
]

const CORNER_DOT_TYPES: { label: string; value: CornerDotType }[] = [
  { label: '方形', value: 'square' },
  { label: '圆形', value: 'dot' },
]

const ERROR_LEVELS: { label: string; value: ErrorCorrectionLevel }[] = [
  { label: 'L (7%)', value: 'L' },
  { label: 'M (15%)', value: 'M' },
  { label: 'Q (25%)', value: 'Q' },
  { label: 'H (30%)', value: 'H' },
]

const DOWNLOAD_SIZES = [
  { label: '320px', value: 320 },
  { label: '512px', value: 512 },
  { label: '1024px', value: 1024 },
  { label: '2048px', value: 2048 },
] as const

const DEFAULT_CONFIG: QrConfig = {
  data: 'https://tools.tf',
  dotType: 'rounded',
  cornerSquareType: 'extra-rounded',
  cornerDotType: 'dot',
  fgColor: '#2563eb',
  useGradient: true,
  gradientColor1: '#2563eb',
  gradientColor2: '#06b6d4',
  gradientType: 'linear',
  bgColor: '#ffffff',
  transparentBg: false,
  errorLevel: 'M',
  logoUrl: '',
  margin: 16,
}

function buildQrOptions(cfg: QrConfig) {
  const gradient = cfg.useGradient
    ? {
        type: cfg.gradientType,
        rotation: 45,
        colorStops: [
          { offset: 0, color: cfg.gradientColor1 },
          { offset: 1, color: cfg.gradientColor2 },
        ],
      }
    : undefined

  return {
    type: 'svg',
    width: 320,
    height: 320,
    margin: cfg.margin,
    data: cfg.data || 'https://tools.tf',
    image: cfg.logoUrl || undefined,
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 6,
      imageSize: 0.3,
    },
    qrOptions: {
      errorCorrectionLevel: cfg.errorLevel,
    },
    dotsOptions: {
      type: cfg.dotType,
      color: cfg.fgColor,
      gradient,
    },
    cornersSquareOptions: {
      type: cfg.cornerSquareType,
      color: cfg.fgColor,
      gradient,
    },
    cornersDotOptions: {
      type: cfg.cornerDotType,
      color: cfg.fgColor,
      gradient,
    },
    backgroundOptions: {
      color: cfg.transparentBg ? 'rgba(0,0,0,0)' : cfg.bgColor,
    },
  }
}

export function QrApp() {
  const [cfg, setCfg] = useState<QrConfig>(DEFAULT_CONFIG)
  const [activePreset, setActivePreset] = useState<number>(1) // Ocean
  const [downloadSize, setDownloadSize] = useState<number>(320)
  const qrRef = useRef<QRCodeStyling | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Init QR instance
  useEffect(() => {
    const qr = new QRCodeStyling(buildQrOptions(cfg))
    qrRef.current = qr
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
      qr.append(containerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update on config change
  useEffect(() => {
    qrRef.current?.update(buildQrOptions(cfg))
  }, [cfg])

  const applyPreset = (idx: number) => {
    setActivePreset(idx)
    setCfg((prev) => ({ ...prev, ...PRESETS[idx].config }))
  }

  const update = (patch: Partial<QrConfig>) => {
    setActivePreset(-1)
    setCfg((prev) => ({ ...prev, ...patch }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      update({ logoUrl: ev.target?.result as string, errorLevel: 'H' })
    }
    reader.readAsDataURL(file)
  }

  const handleDownload = async () => {
    // Scale margin proportionally to download size
    const scale = downloadSize / 320
    const exportQr = new QRCodeStyling({
      ...buildQrOptions(cfg),
      width: downloadSize,
      height: downloadSize,
      margin: Math.round(cfg.margin * scale),
    })
    await exportQr.download({ name: `qrcode-${downloadSize}px`, extension: 'png' })
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="eyebrow">tools.tf</span>
          <h1 className="page-header__name">QR Code 生成器</h1>
        </div>
        <p className="page-header__desc">输入内容，定制样式，生成美观的二维码</p>
      </header>

      <div className="layout">
        {/* Left Panel */}
        <aside className="panel">
          {/* Input */}
          <section className="section">
            <label className="field-label">内容</label>
            <textarea
              className="input"
              rows={3}
              placeholder="输入文字或链接..."
              value={cfg.data}
              onChange={(e) => update({ data: e.target.value })}
            />
          </section>

          {/* Presets */}
          <section className="section">
            <label className="field-label">预设主题</label>
            <div className="presets">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  className={`preset-btn${activePreset === i ? ' active' : ''}`}
                  style={{ '--preset-color': p.color } as React.CSSProperties}
                  onClick={() => applyPreset(i)}
                >
                  <span className="preset-swatch" />
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* Foreground Color */}
          <section className="section">
            <label className="field-label">前景色</label>
            <div className="seg-row">
              <div className="seg">
                <button
                  className={`seg-btn${!cfg.useGradient ? ' active' : ''}`}
                  onClick={() => update({ useGradient: false, fgColor: cfg.gradientColor1 })}
                >
                  纯色
                </button>
                <button
                  className={`seg-btn${cfg.useGradient ? ' active' : ''}`}
                  onClick={() => update({ useGradient: true })}
                >
                  渐变
                </button>
              </div>
              <input
                type="color"
                className="color-picker"
                value={cfg.gradientColor1}
                onChange={(e) => {
                  const color = e.target.value
                  update(cfg.useGradient ? { gradientColor1: color } : { gradientColor1: color, fgColor: color })
                }}
              />
              <span className={`muted${!cfg.useGradient ? ' muted--disabled' : ''}`}>→</span>
              <input
                type="color"
                className="color-picker"
                value={cfg.gradientColor2}
                disabled={!cfg.useGradient}
                onChange={(e) => update({ gradientColor2: e.target.value })}
              />
              <select
                className="select-sm"
                value={cfg.gradientType}
                disabled={!cfg.useGradient}
                onChange={(e) => update({ gradientType: e.target.value as GradientType })}
              >
                <option value="linear">线性</option>
                <option value="radial">径向</option>
              </select>
            </div>
          </section>

          {/* Background */}
          <section className="section">
            <label className="field-label">背景色</label>
            <div className="seg-row">
              <div className="seg">
                <button
                  className={`seg-btn${!cfg.transparentBg ? ' active' : ''}`}
                  onClick={() => update({ transparentBg: false })}
                >
                  纯色
                </button>
                <button
                  className={`seg-btn${cfg.transparentBg ? ' active' : ''}`}
                  onClick={() => update({ transparentBg: true })}
                >
                  透明
                </button>
              </div>
              <div className={`color-preview${cfg.transparentBg ? ' color-preview--transparent' : ''}`}>
                {!cfg.transparentBg && (
                  <input
                    type="color"
                    className="color-picker"
                    value={cfg.bgColor}
                    onChange={(e) => update({ bgColor: e.target.value })}
                  />
                )}
              </div>
            </div>
          </section>

          {/* Margin */}
          <section className="section">
            <label className="field-label">
              边距 <span className="field-label-value">{cfg.margin}px</span>
            </label>
            <input
              type="range"
              className="slider"
              min={0}
              max={60}
              step={4}
              value={cfg.margin}
              onChange={(e) => update({ margin: Number(e.target.value) })}
            />
            <div className="slider-hints">
              <span>无</span>
              <span>大</span>
            </div>
          </section>

          {/* Dot Style */}
          <section className="section">
            <label className="field-label">点阵形状</label>
            <div className="chip-group">
              {DOT_TYPES.map((d) => (
                <button
                  key={d.value}
                  className={`chip${cfg.dotType === d.value ? ' active' : ''}`}
                  onClick={() => update({ dotType: d.value })}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </section>

          {/* Corner Styles */}
          <section className="section two-col">
            <div>
              <label className="field-label">定位框样式</label>
              <div className="chip-group">
                {CORNER_SQUARE_TYPES.map((d) => (
                  <button
                    key={d.value}
                    className={`chip${cfg.cornerSquareType === d.value ? ' active' : ''}`}
                    onClick={() => update({ cornerSquareType: d.value })}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">定位点样式</label>
              <div className="chip-group">
                {CORNER_DOT_TYPES.map((d) => (
                  <button
                    key={d.value}
                    className={`chip${cfg.cornerDotType === d.value ? ' active' : ''}`}
                    onClick={() => update({ cornerDotType: d.value })}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Error Correction */}
          <section className="section">
            <label className="field-label">容错等级</label>
            <div className="chip-group">
              {ERROR_LEVELS.map((e) => (
                <button
                  key={e.value}
                  className={`chip${cfg.errorLevel === e.value ? ' active' : ''}`}
                  onClick={() => update({ errorLevel: e.value })}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </section>

          {/* Logo */}
          <section className="section">
            <label className="field-label">嵌入 Logo（可选）</label>
            <div className="logo-upload">
              <label className="upload-btn">
                <input type="file" accept="image/*" onChange={handleLogoUpload} />
                {cfg.logoUrl ? '更换图片' : '上传图片'}
              </label>
              {cfg.logoUrl && (
                <button
                  className="remove-btn"
                  onClick={() => update({ logoUrl: '', errorLevel: 'M' })}
                >
                  移除
                </button>
              )}
              {cfg.logoUrl && (
                <span className="hint">已启用 H 级容错以确保可扫性</span>
              )}
            </div>
          </section>
        </aside>

        {/* Right Preview */}
        <main className="preview-area">
          <div
            ref={containerRef}
            className={`qr-canvas${cfg.transparentBg ? ' qr-canvas--transparent' : ''}`}
          />
          <div className="download-row">
            <div className="seg">
              {DOWNLOAD_SIZES.map((s) => (
                <button
                  key={s.value}
                  className={`seg-btn${downloadSize === s.value ? ' active' : ''}`}
                  onClick={() => setDownloadSize(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <button className="download-btn" onClick={handleDownload}>
            下载 PNG
          </button>
          <p className="scan-hint">请用手机扫码验证内容是否正确后再分享</p>
        </main>
      </div>
    </div>
  )
}
