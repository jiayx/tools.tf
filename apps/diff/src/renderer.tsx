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
        <title>{pick(locale, { en: 'Diff · Text comparison', zh: 'Diff · 文本差异对比' })}</title>
        <meta name="description" content={pick(locale, {
          en: 'Compare two text blocks with clear, syntax-highlighted differences.',
          zh: '输入两段文本，实时查看清晰、美观的差异对比。',
        })} />
        <link rel="icon" type="image/png" href="https://icon.tools.tf/icon/128?type=lucide&fg=%23a7d382&bg=transparent&textGlyph=100&iconGlyph=100&radius=0&icon=file-diff" />
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
