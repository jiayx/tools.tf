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
    name: 'Timezone Converter',
    tagline: '跨时区时间助手',
    description: 'Type a natural-language time description ("tomorrow 9am"), pick the sender\'s timezone, and get the converted local time instantly.',
    url: 'https://datetime.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=tabler&fg=%231946ae&bg=transparent&iconGlyph=80&icon=timezone',
    accent: '#1946ae',
  },
  {
    name: 'QR Code',
    tagline: '生成美观的二维码',
    description: '输入文字或链接，自定义颜色、渐变、点阵风格，一键生成好看的二维码并下载。',
    url: 'https://qr.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=lucide&fg=%23f59e0b&bg=transparent&iconGlyph=80&icon=qr-code',
    accent: '#f59e0b',
  },
]

const ToolCard = ({ tool }: { tool: Tool }) => (
  <a class="tool-card" href={tool.url} style={`--accent: ${tool.accent}`}>
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
