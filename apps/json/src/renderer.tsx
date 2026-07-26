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
        <title>{pick(locale, { en: 'JSON Formatter · tools.tf', zh: 'JSON 格式化 · tools.tf' })}</title>
        <meta name="description" content={pick(locale, {
          en: 'Format, validate, highlight, minify, and copy JSON in your browser.',
          zh: '在线 JSON 格式化、校验与高亮工具，支持折叠、压缩、复制。',
        })} />
        <link rel="icon" type="image/png" href="https://icon.tools.tf/icon/128?type=lucide&fg=%238b5cf6&bg=transparent&iconGlyph=100&icon=braces" />
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
