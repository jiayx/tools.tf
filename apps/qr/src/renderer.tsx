/** @jsxImportSource hono/jsx */
import { localeTag, pick, resolveLocale } from '@tools/i18n'
import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, Script, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children }, c) => {
  const locale = resolveLocale(c.req.header('Accept-Language'))
  c.header('Vary', 'Accept-Language')
  return (
    <html lang={localeTag(locale)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{pick(locale, { en: 'QR Code Generator · tools.tf', zh: '二维码生成器 · tools.tf' })}</title>
        <meta name="description" content={pick(locale, {
          en: 'Create polished QR codes with custom colors, gradients, patterns, and downloads.',
          zh: '输入文字或链接，自定义颜色、渐变、点阵风格，一键生成好看的二维码并下载。',
        })} />
        <link rel="icon" type="image/png" href="https://icon.tools.tf/icon/128?type=lucide&fg=%23f59e0b&bg=transparent&textGlyph=100&iconGlyph=100&radius=0&icon=qr-code" />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Script type="module" src="/src/main.tsx" />
      </body>
    </html>
  )
})
