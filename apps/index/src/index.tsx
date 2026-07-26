import { pick, resolveLocale, type Locale } from '@tools/i18n'
import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

type Tool = {
  name: string
  tagline: { en: string; zh: string }
  description: { en: string; zh: string }
  url: string
  icon: string
  accent: string
}

const tools: Tool[] = [
  {
    name: 'Icon Atelier',
    tagline: { en: 'Craft icons on the fly', zh: '即时制作专属图标' },
    description: {
      en: 'Generate SVG icons from text, Lucide, Tabler, or logo sets — with gradient backgrounds, custom colors, and direct URL embedding.',
      zh: '使用文字、Lucide、Tabler 或品牌图标生成 SVG，支持渐变背景、自定义颜色和 URL 直接引用。',
    },
    url: 'https://icon.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=tabler&fg=%236366f1&bg=transparent&iconGlyph=80&icon=icons',
    accent: '#6366f1',
  },
  {
    name: 'Edge Drop',
    tagline: { en: 'Temporary sharing rooms', zh: '临时分享房间' },
    description: {
      en: 'Create a 6-digit room for instant file drops and lightweight chat, with media previews and automatic 24-hour expiry.',
      zh: '创建 6 位房间码，即时传文件和轻量聊天，支持媒体预览并在 24 小时后自动过期。',
    },
    url: 'https://drop.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=tabler&fg=%2338bdf8&bg=transparent&iconGlyph=80&icon=transfer',
    accent: '#38bdf8',
  },
  {
    name: 'ttys',
    tagline: { en: 'Live terminal sharing', zh: '实时共享终端' },
    description: {
      en: 'Share a local terminal anonymously through the browser, with synchronized sessions and host-approved remote control.',
      zh: '通过浏览器匿名共享本地终端，支持会话同步及由主机批准的远程控制。',
    },
    url: 'https://ttys.tools.tf',
    icon: 'https://ttys.tools.tf/logo.svg',
    accent: '#fbbf24',
  },
  {
    name: 'Diff',
    tagline: { en: 'Text diff viewer', zh: '文本差异查看器' },
    description: {
      en: 'Paste two text blocks and get a clear, syntax-highlighted diff — with auto language detection and line-by-line comparison.',
      zh: '粘贴两段文本，自动检测语言并逐行展示带语法高亮的清晰差异。',
    },
    url: 'https://diff.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=lucide&fg=%23a7d382&bg=transparent&iconGlyph=80&icon=file-diff',
    accent: '#a7d382',
  },
  {
    name: 'IP Lookup',
    tagline: { en: 'Your network snapshot', zh: '你的网络概览' },
    description: {
      en: 'Instantly see your public IP address, geolocation, timezone, coordinates, and network info — powered by Cloudflare edge headers.',
      zh: '基于 Cloudflare 边缘请求头，即时查看公网 IP、位置、时区、坐标和网络信息。',
    },
    url: 'https://ip.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=tabler&fg=%230e4ee1&bg=transparent&textGlyph=100&iconGlyph=100&radius=0&icon=location-star',
    accent: '#0ea5e9',
  },
  {
    name: 'QR Code',
    tagline: { en: 'Stylish QR generation', zh: '美观的二维码生成' },
    description: {
      en: 'Turn text or links into polished QR codes with custom colors, gradients, dot styles, and one-click download.',
      zh: '将文字或链接生成精美二维码，自定义颜色、渐变和点阵样式，并一键下载。',
    },
    url: 'https://qr.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=lucide&fg=%23f59e0b&bg=transparent&iconGlyph=80&icon=qr-code',
    accent: '#f59e0b',
  },
  {
    name: 'Password Generator',
    tagline: { en: 'Secure random passwords', zh: '安全随机密码' },
    description: {
      en: 'Generate strong passwords locally in the browser with configurable length and character sets, then copy them instantly.',
      zh: '在浏览器本地生成强密码，可配置长度和字符集并即时复制。',
    },
    url: 'https://password.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=lucide&fg=%2310b981&bg=transparent&iconGlyph=80&icon=key-round',
    accent: '#10b981',
  },
  {
    name: 'JSON Formatter',
    tagline: { en: 'Format, validate, highlight', zh: '格式化、校验与高亮' },
    description: {
      en: 'Paste JSON to format and validate it instantly, with syntax highlighting, error feedback, folding, minifying, and copy support.',
      zh: '粘贴 JSON 即时格式化和校验，支持语法高亮、错误提示、折叠、压缩与复制。',
    },
    url: 'https://json.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=lucide&fg=%238b5cf6&bg=transparent&iconGlyph=80&icon=braces',
    accent: '#8b5cf6',
  },
  {
    name: 'Timezone Converter',
    tagline: { en: 'Cross-timezone scheduling', zh: '跨时区日程换算' },
    description: {
      en: 'Type a natural-language time description ("tomorrow 9am"), pick the sender\'s timezone, and get the converted local time instantly.',
      zh: '输入“明天上午 9 点”等自然语言时间，选择原时区，即时换算本地时间。',
    },
    url: 'https://datetime.tools.tf',
    icon: 'https://icon.tools.tf/icon/48?type=tabler&fg=%231946ae&bg=transparent&iconGlyph=80&icon=timezone',
    accent: '#1946ae',
  },
]

const ToolCard = ({ tool, locale }: { tool: Tool; locale: Locale }) => (
  <a
    class="tool-card"
    href={tool.url}
    target="_blank"
    rel="noopener"
    style={`--accent: ${tool.accent}`}
  >
    <div class="tool-card__icon">
      <img src={tool.icon} alt="" width="48" height="48" decoding="async" />
    </div>
    <div class="tool-card__body">
      <p class="tool-card__tagline">{pick(locale, tool.tagline)}</p>
      <h2 class="tool-card__name">{tool.name}</h2>
      <p class="tool-card__desc">{pick(locale, tool.description)}</p>
    </div>
    <span class="tool-card__arrow" aria-hidden="true">→</span>
  </a>
)

app.get('/', (c) => {
  const locale = resolveLocale(c.req.header('Accept-Language'))
  return c.render(
    <div class="page">
      <header class="hero">
        <h1 class="hero__title">{pick(locale, {
          en: 'Small tools, sharp focus.',
          zh: '小工具，专注解决问题。',
        })}</h1>
        <p class="hero__sub">{pick(locale, {
          en: 'A growing collection of dev utilities. No sign-up, no tracking.',
          zh: '持续增长的开发者工具集，无需注册，不做追踪。',
        })}</p>
      </header>

      <main class="tools">
        {tools.map((tool) => (
          <ToolCard key={tool.url} tool={tool} locale={locale} />
        ))}
      </main>

      <footer class="footer">
        <p>© 2026 tools.tf</p>
      </footer>
    </div>
  )
})

export default app
