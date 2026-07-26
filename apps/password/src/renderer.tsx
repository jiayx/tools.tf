/** @jsxImportSource hono/jsx */
import { localeTag, pick, resolveLocale } from '@tools/i18n'
import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, Script, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer((_, c) => {
  const locale = resolveLocale(c.req.header('Accept-Language'))
  c.header('Vary', 'Accept-Language')
  return (
    <html lang={localeTag(locale)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{pick(locale, { en: 'Password Generator · tools.tf', zh: '密码生成器 · tools.tf' })}</title>
        <meta name="description" content={pick(locale, {
          en: 'Generate secure passwords locally with custom length and character sets.',
          zh: '在线密码生成器，支持自定义长度、字符类型，一键生成安全强密码并复制。',
        })} />
        <link rel="icon" type="image/png" href="https://icon.tools.tf/icon/128?type=lucide&fg=%2310b981&bg=transparent&textGlyph=100&iconGlyph=100&radius=0&icon=key-round" />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>
        <div id="root"></div>
        <Script type="module" src="/src/main.tsx" />
      </body>
    </html>
  )
})
