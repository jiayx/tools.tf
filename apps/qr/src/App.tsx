/** @jsxImportSource react */
import QRCodeStyling, {
  type CornerDotType,
  type CornerSquareType,
  type DotType,
  type ErrorCorrectionLevel,
  type GradientType,
} from 'qr-code-styling-worker'
import { browserLocale, pick } from '@tools/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_CONFIG,
  type QrConfig,
  buildQrImageQuery,
  buildQrCodeStylingOptions,
} from './image'

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

type LocalizedLabel = { en: string; zh: string }

const DOT_TYPES: { label: LocalizedLabel; value: DotType }[] = [
  { label: { en: 'Square', zh: '方形' }, value: 'square' },
  { label: { en: 'Dots', zh: '圆形' }, value: 'dots' },
  { label: { en: 'Rounded', zh: '圆角' }, value: 'rounded' },
  { label: { en: 'Classy', zh: '优雅' }, value: 'classy' },
  { label: { en: 'Classy rounded', zh: '优雅圆角' }, value: 'classy-rounded' },
  { label: { en: 'Extra rounded', zh: '菱形' }, value: 'extra-rounded' },
]

const CORNER_SQUARE_TYPES: { label: LocalizedLabel; value: CornerSquareType }[] = [
  { label: { en: 'Square', zh: '方形' }, value: 'square' },
  { label: { en: 'Dot', zh: '点形' }, value: 'dot' },
  { label: { en: 'Rounded', zh: '大圆角' }, value: 'extra-rounded' },
]

const CORNER_DOT_TYPES: { label: LocalizedLabel; value: CornerDotType }[] = [
  { label: { en: 'Square', zh: '方形' }, value: 'square' },
  { label: { en: 'Round', zh: '圆形' }, value: 'dot' },
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
const MAX_LOGO_BYTES = 512 * 1024
const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])

export function QrApp() {
  const locale = useMemo(() => browserLocale(), [])
  const copy = useMemo(() => pick(locale, {
    en: {
      title: 'QR Code Generator',
      description: 'Enter content, customize the style, and create a polished QR code.',
      content: 'Content',
      placeholder: 'Enter text or a link...',
      presets: 'Theme presets',
      foreground: 'Foreground',
      solid: 'Solid',
      gradient: 'Gradient',
      linear: 'Linear',
      radial: 'Radial',
      background: 'Background',
      transparent: 'Transparent',
      margin: 'Margin',
      none: 'None',
      large: 'Large',
      dots: 'Dot style',
      cornerSquare: 'Finder frame style',
      cornerDot: 'Finder dot style',
      correction: 'Error correction',
      logo: 'Embed a logo (optional)',
      replace: 'Replace image',
      upload: 'Upload image',
      remove: 'Remove',
      logoHint: 'Error correction is set to H to keep the code scannable.',
      download: 'Download PNG',
      localLogo: 'QR codes with logos are generated only in your browser. Use the download button to save.',
      open: 'Open the current QR code in a new page',
      scan: 'Scan the code with your phone to verify it before sharing.',
      invalidLogo: 'Logo must be PNG, JPEG, GIF, or WebP',
      logoTooLarge: 'Logo cannot exceed 512KB',
      generateFailed: 'QR generation failed. Shorten the content or remove the logo and try again.',
    },
    zh: {
      title: 'QR Code 生成器',
      description: '输入内容，定制样式，生成美观的二维码',
      content: '内容',
      placeholder: '输入文字或链接...',
      presets: '预设主题',
      foreground: '前景色',
      solid: '纯色',
      gradient: '渐变',
      linear: '线性',
      radial: '径向',
      background: '背景色',
      transparent: '透明',
      margin: '边距',
      none: '无',
      large: '大',
      dots: '点阵形状',
      cornerSquare: '定位框样式',
      cornerDot: '定位点样式',
      correction: '容错等级',
      logo: '嵌入 Logo（可选）',
      replace: '更换图片',
      upload: '上传图片',
      remove: '移除',
      logoHint: '已启用 H 级容错以确保可扫性',
      download: '下载 PNG',
      localLogo: '带 Logo 的二维码仅在浏览器本地生成，请使用下载按钮保存',
      open: '在新页面打开当前二维码',
      scan: '请用手机扫码验证内容是否正确后再分享',
      invalidLogo: 'Logo 仅支持 PNG、JPEG、GIF 或 WebP',
      logoTooLarge: 'Logo 不能超过 512KB',
      generateFailed: '二维码生成失败，请缩短内容或移除 Logo 后重试',
    },
  }), [locale])
  const [cfg, setCfg] = useState<QrConfig>(DEFAULT_CONFIG)
  const [inputValue, setInputValue] = useState<string>(DEFAULT_CONFIG.data)
  const [activePreset, setActivePreset] = useState<number>(1) // Ocean
  const [downloadSize, setDownloadSize] = useState<number>(320)
  const [isComposing, setIsComposing] = useState(false)
  const [error, setError] = useState('')
  const qrRef = useRef<QRCodeStyling | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const qr = new QRCodeStyling(buildQrCodeStylingOptions({ ...cfg, size: 320 }))
    qrRef.current = qr

    if (containerRef.current) {
      containerRef.current.innerHTML = ''
      qr.append(containerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    qrRef.current?.update(buildQrCodeStylingOptions({ ...cfg, size: 320 }))
  }, [cfg])

  const applyPreset = (idx: number) => {
    setActivePreset(idx)
    setCfg((prev) => ({ ...prev, ...PRESETS[idx].config }))
  }

  const update = (patch: Partial<QrConfig>) => {
    setActivePreset(-1)
    setCfg((prev) => ({ ...prev, ...patch }))
  }

  const commitData = (value: string) => {
    setActivePreset(-1)
    setCfg((prev) => ({ ...prev, data: value }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      setError(copy.invalidLogo)
      e.target.value = ''
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError(copy.logoTooLarge)
      e.target.value = ''
      return
    }

    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      update({ logoUrl: ev.target?.result as string, errorLevel: 'H' })
    }
    reader.readAsDataURL(file)
  }

  const handleDownload = async () => {
    try {
      setError('')
      const exportQr = new QRCodeStyling(buildQrCodeStylingOptions({ ...cfg, size: downloadSize }))
      await exportQr.download({ name: `qrcode-${downloadSize}px`, extension: 'png' })
    } catch {
      setError(copy.generateFailed)
    }
  }

  const imageUrl = `/image?${buildQrImageQuery({ ...cfg, size: downloadSize })}`

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="eyebrow">tools.tf</span>
          <h1 className="page-header__name">{copy.title}</h1>
        </div>
        <p className="page-header__desc">{copy.description}</p>
      </header>

      <div className="layout">
        {/* Left Panel */}
        <aside className="panel">
          {/* Input */}
          <section className="section">
            <label className="field-label">{copy.content}</label>
            <textarea
              className="input"
              rows={3}
              placeholder={copy.placeholder}
              value={inputValue}
              onChange={(e) => {
                const nextValue = e.target.value
                setInputValue(nextValue)
                if (!isComposing) {
                  commitData(nextValue)
                }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={(e) => {
                const nextValue = e.currentTarget.value
                setIsComposing(false)
                setInputValue(nextValue)
                commitData(nextValue)
              }}
            />
          </section>

          {/* Presets */}
          <section className="section">
            <label className="field-label">{copy.presets}</label>
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
            <label className="field-label">{copy.foreground}</label>
            <div className="seg-row">
              <div className="seg">
                <button
                  className={`seg-btn${!cfg.useGradient ? ' active' : ''}`}
                  onClick={() => update({ useGradient: false, fgColor: cfg.gradientColor1 })}
                >
                  {copy.solid}
                </button>
                <button
                  className={`seg-btn${cfg.useGradient ? ' active' : ''}`}
                  onClick={() => update({ useGradient: true })}
                >
                  {copy.gradient}
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
                <option value="linear">{copy.linear}</option>
                <option value="radial">{copy.radial}</option>
              </select>
            </div>
          </section>

          {/* Background */}
          <section className="section">
            <label className="field-label">{copy.background}</label>
            <div className="seg-row">
              <div className="seg">
                <button
                  className={`seg-btn${!cfg.transparentBg ? ' active' : ''}`}
                  onClick={() => update({ transparentBg: false })}
                >
                  {copy.solid}
                </button>
                <button
                  className={`seg-btn${cfg.transparentBg ? ' active' : ''}`}
                  onClick={() => update({ transparentBg: true })}
                >
                  {copy.transparent}
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
              {copy.margin} <span className="field-label-value">{cfg.margin}px</span>
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
              <span>{copy.none}</span>
              <span>{copy.large}</span>
            </div>
          </section>

          {/* Dot Style */}
          <section className="section">
            <label className="field-label">{copy.dots}</label>
            <div className="chip-group">
              {DOT_TYPES.map((d) => (
                <button
                  key={d.value}
                  className={`chip${cfg.dotType === d.value ? ' active' : ''}`}
                  onClick={() => update({ dotType: d.value })}
                >
                  {pick(locale, d.label)}
                </button>
              ))}
            </div>
          </section>

          {/* Corner Styles */}
          <section className="section two-col">
            <div>
              <label className="field-label">{copy.cornerSquare}</label>
              <div className="chip-group">
                {CORNER_SQUARE_TYPES.map((d) => (
                  <button
                    key={d.value}
                    className={`chip${cfg.cornerSquareType === d.value ? ' active' : ''}`}
                    onClick={() => update({ cornerSquareType: d.value })}
                  >
                    {pick(locale, d.label)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">{copy.cornerDot}</label>
              <div className="chip-group">
                {CORNER_DOT_TYPES.map((d) => (
                  <button
                    key={d.value}
                    className={`chip${cfg.cornerDotType === d.value ? ' active' : ''}`}
                    onClick={() => update({ cornerDotType: d.value })}
                  >
                    {pick(locale, d.label)}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Error Correction */}
          <section className="section">
            <label className="field-label">{copy.correction}</label>
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
            <label className="field-label">{copy.logo}</label>
            <div className="logo-upload">
              <label className="upload-btn">
                <input type="file" accept="image/*" onChange={handleLogoUpload} />
                {cfg.logoUrl ? copy.replace : copy.upload}
              </label>
              {cfg.logoUrl && (
                <button
                  className="remove-btn"
                  onClick={() => update({ logoUrl: '', errorLevel: 'M' })}
                >
                  {copy.remove}
                </button>
              )}
              {cfg.logoUrl && (
                <span className="hint">{copy.logoHint}</span>
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
            {copy.download}
          </button>
          {cfg.logoUrl ? (
            <p className="scan-hint">{copy.localLogo}</p>
          ) : (
            <a className="preview-link-inline" href={imageUrl} target="_blank" rel="noreferrer">
              {copy.open}
            </a>
          )}
          {error && <p className="error-message" role="alert">{error}</p>}
          <p className="scan-hint">{copy.scan}</p>
        </main>
      </div>
    </div>
  )
}
