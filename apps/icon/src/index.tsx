import { Hono } from 'hono'
import { renderer } from './renderer'
import {
  FALLBACK_ICON_MARKUP,
  type IconSetId,
  getIconWrapperAttributes,
  loadIconSetData,
} from './registry/icon-registry'
import { ICON_SET_META } from './registry/icon-types'
import { DEFAULTS, PRESETS } from './config'
import { resolveIconSet } from './shared/parse'
import { buildBackgroundParts, buildIconSvg, buildTextSvg } from './shared/svg'
import { parseIconQuery } from './shared/query'
import { KVNamespace } from '@cloudflare/workers-types'

const app = new Hono<{ Bindings: { KV: KVNamespace } }>()

app.use(renderer)

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback
  const num = Number(value)
  if (Number.isNaN(num)) return fallback
  return num
}

const parseHex = (value: string | undefined, fallback: string) => {
  if (!value) return fallback
  const normalized = value.trim()
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : fallback
}

const sanitizeText = (value: string | undefined, fallback: string) => {
  if (!value) return fallback
  const trimmed = value.replace(/\s+/g, '').slice(0, 6)
  return trimmed ? trimmed : fallback
}

type IconOptions = {
  type: 'text' | IconSetId
  text: string
  icon: string
  fg: string
  bgMode: 'solid' | 'gradient' | 'transparent'
  bg1: string
  bg2: string
  angle: number
  size: number
  textGlyph: number
  iconGlyph: number
  radius: number
}

const parseOptions = (query: Record<string, string>, sizeParam?: string) => {
  const parsed = parseIconQuery(query)
  const type = parsed.type

  const size = clamp(parseNumber(sizeParam || query.size, DEFAULTS.size), 16, 1024)
  const angle = clamp(parseNumber(query.angle, DEFAULTS.angle), 0, 360)
  const radius = clamp(parseNumber(query.radius, DEFAULTS.radius), 0, 50)

  const bgMode = parsed.bgMode
  const textGlyph = clamp(parseNumber(query.textGlyph || query.glyph, DEFAULTS.textGlyph), 1, 100)
  const iconGlyph = clamp(parseNumber(query.iconGlyph || query.glyph, DEFAULTS.iconGlyph), 32, 100)

  const bg1 = parseHex(query.bg1, DEFAULTS.bg1)
  const bg2 = query.bg2 ? parseHex(query.bg2, bg1) : bg1
  const iconSet = resolveIconSet(type)
  const iconFallback = ICON_SET_META[iconSet].defaultIcon || DEFAULTS.icon

  return {
    type,
    text: sanitizeText(parsed.text, DEFAULTS.text),
    icon: (parsed.icon || '').trim().toLowerCase() || iconFallback,
    fg: parseHex(parsed.fg, DEFAULTS.fg),
    bgMode,
    bg1,
    bg2,
    angle,
    size,
    textGlyph,
    iconGlyph,
    radius,
  } satisfies IconOptions
}

const buildSvg = async (options: IconOptions, kv?: KVNamespace) => {
  const { size, fg, bgMode, bg1, bg2, angle, type, text, icon, textGlyph, iconGlyph, radius } = options
  const { defs, backgroundMarkup, clipPath } = buildBackgroundParts({ size, bgMode, bg1, bg2, angle, radius })

  if (type === 'text') {
    return buildTextSvg({ size, glyph: textGlyph, text, fg, defs, backgroundMarkup, clipPath })
  }

  const iconSet = resolveIconSet(type)
  const data = await loadIconSetData(iconSet, kv)
  const iconMarkup = data.getMarkup(icon) ?? FALLBACK_ICON_MARKUP
  const iconWrapper = getIconWrapperAttributes(iconSet, fg)
  return buildIconSvg({ size, glyph: iconGlyph, iconMarkup, wrapper: iconWrapper, defs, backgroundMarkup, clipPath })
}

const IconPage = () => {
  const getPresetBackground = (bgMode: string, bg1: string, bg2: string, angle: number) => {
    if (bgMode === 'solid') return bg1
    if (bgMode === 'transparent') return 'transparent'
    return `linear-gradient(${angle}deg, ${bg1}, ${bg2})`
  }

  return (
    <main class="page">
      <header class="hero">
        <div class="hero__text">
          <p class="eyebrow">
            <a href="/" class="eyebrow__link">Icon Atelier</a>
          </p>
          <h1>Craft an icon that feels like your brand.</h1>
        </div>
      </header>

      <section class="studio">
        <form class="panel controls" data-form>
          <div class="panel__header">
            <div class="panel__header-main">
              <h3>Build your mark</h3>
              <button type="button" class="panel__reset" data-reset>
                Reset
              </button>
            </div>
            <p>Pick a style, then refine colors and scale.</p>
          </div>

          <div class="control">
            <label>Icon mode</label>
            <div class="segmented" data-mode>
              <button type="button" class="segmented__btn is-active" data-mode-btn data-mode-value="text">
                Text
              </button>
              <button type="button" class="segmented__btn" data-mode-btn data-mode-value="lucide">
                Lucide icon
              </button>
              <button type="button" class="segmented__btn" data-mode-btn data-mode-value="tabler">
                Tabler icon
              </button>
              <button type="button" class="segmented__btn" data-mode-btn data-mode-value="logos">
                Logos
              </button>
            </div>
          </div>

          <div class="control-group control-group--paired" data-text-controls>
            <div class="control control--full">
              <label htmlFor="textInput">Text</label>
              <input id="textInput" type="text" maxlength={6} value={DEFAULTS.text} data-field="text" />
              <span class="helper">Keep it short: up to 6 characters.</span>
            </div>
            <div class="control">
              <div class="control__head">
                <label htmlFor="glyphSizeText">Text size</label>
                <span class="control__value" data-field-value="textGlyph">{DEFAULTS.textGlyph}%</span>
              </div>
              <div class="range">
                <input id="glyphSizeText" type="range" min={1} max={100} value={DEFAULTS.textGlyph} data-field="textGlyph" />
              </div>
            </div>
            <div data-radius-anchor="text"></div>
          </div>

          <div class="control" data-radius-control>
            <div class="control__head">
              <label htmlFor="radiusRange">Corner radius</label>
              <span class="control__value" data-field-value="radius">{DEFAULTS.radius}%</span>
            </div>
            <div class="range">
              <input id="radiusRange" type="range" min={0} max={50} value={DEFAULTS.radius} data-field="radius" />
            </div>
          </div>

          <div class="control-group control-group--paired is-hidden" data-icon-controls>
            <div class="control control--full">
              <label htmlFor="iconSearch">Icon</label>
              <div class="icon-dropdown" data-icon-dropdown>
                <button type="button" class="icon-trigger" data-icon-trigger>
                  <span class="icon-trigger__preview" aria-hidden="true">
                    <span data-icon-trigger-preview></span>
                  </span>
                  <span class="icon-trigger__label" data-icon-label>
                    {DEFAULTS.icon}
                  </span>
                  <span class="icon-trigger__caret" aria-hidden="true">
                    ▾
                  </span>
                </button>
                <div class="icon-menu is-hidden" data-icon-menu>
                  <input
                    id="iconSearch"
                    type="text"
                    placeholder={`Search ${ICON_SET_META.lucide.label.toLowerCase()} icons`}
                    data-icon-filter
                  />
                  <div class="icon-options" data-icon-options>
                  </div>
                </div>
                <input type="hidden" data-field="icon" value={DEFAULTS.icon} />
              </div>
            </div>
            <div class="control">
              <div class="control__head">
                <label htmlFor="glyphSizeIcon">Icon size</label>
                <span class="control__value" data-field-value="iconGlyph">{DEFAULTS.iconGlyph}%</span>
              </div>
              <div class="range">
                <input id="glyphSizeIcon" type="range" min={32} max={100} value={DEFAULTS.iconGlyph} data-field="iconGlyph" />
              </div>
            </div>
            <div data-radius-anchor="icon"></div>
          </div>

          <div class="control-group">
            <div class="control">
              <label>Theme presets</label>
              <div class="preset-row">
                {PRESETS.map((preset, index) => {
                  const background = getPresetBackground(preset.bgMode, preset.bg1, preset.bg2, preset.angle)
                  return (
                    <button
                      type="button"
                      class="preset-chip"
                      data-preset={String(index)}
                      style={`--preset-fg: ${preset.fg}; --preset-bg: ${background}`}
                    >
                      <span class="preset-swatch" style={`background: ${background}`}></span>
                      {preset.label}
                    </button>
                  )
                })}
                <button type="button" class="preset-chip preset-chip--random" data-random>
                  <span class="preset-swatch preset-swatch--rainbow"></span>
                  Random
                </button>
              </div>
            </div>
            <div class="control">
              <label>Background style</label>
              <div class="segmented" data-bg-mode>
                <button type="button" class="segmented__btn" data-bg-mode-btn data-bg-mode-value="transparent">
                  Transparent
                </button>
                <button type="button" class="segmented__btn" data-bg-mode-btn data-bg-mode-value="solid">
                  Solid
                </button>
                <button
                  type="button"
                  class="segmented__btn is-active"
                  data-bg-mode-btn
                  data-bg-mode-value="gradient"
                >
                  Gradient
                </button>
              </div>
            </div>
            <div class="control" data-fg-control>
              <label>Foreground</label>
              <div class="color">
                <input type="color" value={DEFAULTS.fg} data-field="fg" />
                <input type="text" value={DEFAULTS.fg} data-field="fgText" />
              </div>
            </div>
            <div class="control" data-bg1-control>
              <label>Background 1</label>
              <div class="color">
                <input type="color" value={DEFAULTS.bg1} data-field="bg1" />
                <input type="text" value={DEFAULTS.bg1} data-field="bg1Text" />
              </div>
            </div>
            <div class="control" data-bg2-control>
              <label>Background 2</label>
              <div class="color">
                <input type="color" value={DEFAULTS.bg2} data-field="bg2" />
                <input type="text" value={DEFAULTS.bg2} data-field="bg2Text" />
              </div>
            </div>
          </div>

          <div class="control" data-angle-control>
            <label htmlFor="angleRange">Gradient angle</label>
            <div class="range">
              <input id="angleRange" type="range" min={0} max={360} value={DEFAULTS.angle} data-field="angle" />
              <span data-field-value="angle">{DEFAULTS.angle}°</span>
            </div>
          </div>

          <div class="control">
            <label htmlFor="sizeRange">Export size</label>
            <div class="range">
              <input id="sizeRange" type="range" min={16} max={1024} step={8} value={DEFAULTS.size} data-field="size" />
              <span data-field-value="size">{DEFAULTS.size}px</span>
            </div>
          </div>

        </form>

        <aside class="panel preview">
          <div class="panel__header">
            <h3>Live preview</h3>
            <p>Use the URL below for direct icon usage.</p>
          </div>

          <div class="preview__canvas is-loading" data-preview-canvas>
            <div class="preview__image" data-preview aria-label="Icon preview"></div>
          </div>

          <div class="preview__url">
            <input type="text" readOnly data-url />
            <button type="button" data-copy>
              Copy
            </button>
          </div>

          <div class="preview__sizes">
            <div class="preview__sizes-header">
              <p>Common icon sizes</p>
              <div class="segmented segmented--compact" data-download-format>
                <button type="button" class="segmented__btn is-active" data-format-btn data-format="svg">
                  SVG
                </button>
                <button type="button" class="segmented__btn" data-format-btn data-format="png">
                  PNG
                </button>
                <button type="button" class="segmented__btn" data-format-btn data-format="jpeg">
                  JPEG
                </button>
                <button type="button" class="segmented__btn" data-format-btn data-format="webp">
                  WebP
                </button>
              </div>
            </div>
            <div class="chip-row">
              {[16, 32, 48, 64, 96, 128, 256, 512, 1024].map((size) => (
                <div class="chip-group">
                  <a class="chip" href="#" data-size-link data-size={size}>
                    {size}px
                  </a>
                  <a
                    class="chip chip--download"
                    href="#"
                    data-size-download
                    data-size={size}
                    aria-label={`Download ${size}px SVG`}
                  >
                    <span class="chip__icon" aria-hidden="true">↓</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div class="preview__snippet">
            <p>HTML snippets</p>
            <div class="snippet-list" data-snippet-list></div>
          </div>
        </aside>
      </section>
      <footer class="footer">
        <p>
          © 2026 <a href="https://www.tools.tf" target="_blank" rel="noreferrer">tools.tf</a>
        </p>
      </footer>
    </main>
  )
}

app.get('/', (c) => {
  return c.render(<IconPage />)
})

app.get('/icon/:size?', async (c) => {
  const options = parseOptions(c.req.query(), c.req.param('size'))
  const svg = await buildSvg(options, c.env.KV)
  return c.body(svg, 200, {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  })
})

export default app
