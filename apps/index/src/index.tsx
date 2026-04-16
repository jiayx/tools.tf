import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

type Tool = {
  name: string
  tagline: string
  description: string
  url: string
  icon: string
  accent: string
}

const tools: Tool[] = [
  {
    name: 'Icon Atelier',
    tagline: 'Craft icons on the fly',
    description: 'Generate SVG icons from text, Lucide, Tabler, or logo sets — with gradient backgrounds, custom colors, and direct URL embedding.',
    url: 'https://icon.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=tabler&fg=%236366f1&bg=transparent&iconGlyph=80&icon=icons',
    accent: '#6366f1',
  },
  {
    name: 'Diff',
    tagline: 'Text diff viewer',
    description: 'Paste two text blocks and get a clear, syntax-highlighted diff — with auto language detection and line-by-line comparison.',
    url: 'https://diff.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=lucide&fg=%23a7d382&bg=transparent&iconGlyph=80&icon=file-diff',
    accent: '#a7d382',
  },
  {
    name: 'IP Lookup',
    tagline: 'Your network snapshot',
    description: 'Instantly see your public IP address, geolocation, timezone, coordinates, and network info — powered by Cloudflare edge headers.',
    url: 'https://ip.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=tabler&fg=%230e4ee1&bg=transparent&textGlyph=100&iconGlyph=100&radius=0&icon=location-star',
    accent: '#0ea5e9',
  },
  {
    name: 'Edge Drop',
    tagline: 'Temporary sharing rooms',
    description: 'Create a 6-digit room for instant file drops and lightweight chat, with media previews and automatic 24-hour expiry.',
    url: 'https://drop.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=lucide&fg=%2338bdf8&bg=transparent&iconGlyph=80&icon=cloud-upload',
    accent: '#38bdf8',
  },
  {
    name: 'QR Code',
    tagline: 'Stylish QR generation',
    description: 'Turn text or links into polished QR codes with custom colors, gradients, dot styles, and one-click download.',
    url: 'https://qr.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=lucide&fg=%23f59e0b&bg=transparent&iconGlyph=80&icon=qr-code',
    accent: '#f59e0b',
  },
  {
    name: 'Password Generator',
    tagline: 'Secure random passwords',
    description: 'Generate strong passwords locally in the browser with configurable length and character sets, then copy them instantly.',
    url: 'https://password.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=lucide&fg=%2310b981&bg=transparent&iconGlyph=80&icon=key-round',
    accent: '#10b981',
  },
  {
    name: 'JSON Formatter',
    tagline: 'Format, validate, highlight',
    description: 'Paste JSON to format and validate it instantly, with syntax highlighting, error feedback, folding, minifying, and copy support.',
    url: 'https://json.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=lucide&fg=%238b5cf6&bg=transparent&iconGlyph=80&icon=braces',
    accent: '#8b5cf6',
  },
  {
    name: 'Timezone Converter',
    tagline: 'Cross-timezone scheduling',
    description: 'Type a natural-language time description ("tomorrow 9am"), pick the sender\'s timezone, and get the converted local time instantly.',
    url: 'https://datetime.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=tabler&fg=%231946ae&bg=transparent&iconGlyph=80&icon=timezone',
    accent: '#1946ae',
  },
]

const ToolCard = ({ tool }: { tool: Tool }) => (
  <a
    class="tool-card"
    href={tool.url}
    target="_blank"
    rel="noopener"
    style={`--accent: ${tool.accent}`}
  >
    <div class="tool-card__icon">
      <img src={tool.icon} alt="" width="48" height="48" />
    </div>
    <div class="tool-card__body">
      <p class="tool-card__tagline">{tool.tagline}</p>
      <h2 class="tool-card__name">{tool.name}</h2>
      <p class="tool-card__desc">{tool.description}</p>
    </div>
    <span class="tool-card__arrow" aria-hidden="true">→</span>
  </a>
)

app.get('/', (c) => {
  return c.render(
    <div class="page">
      <header class="hero">
        <h1 class="hero__title">Small tools, sharp focus.</h1>
        <p class="hero__sub">A growing collection of dev utilities. No sign-up, no tracking.</p>
      </header>

      <main class="tools">
        {tools.map((tool) => (
          <ToolCard tool={tool} />
        ))}
      </main>

      <footer class="footer">
        <p>© 2026 tools.tf</p>
      </footer>
    </div>
  )
})

export default app
