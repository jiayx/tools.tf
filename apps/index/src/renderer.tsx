import { localeTag, pick, resolveLocale } from '@tools/i18n'
import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children }, c) => {
  const locale = resolveLocale(c.req.header('Accept-Language'))
  c.header('Vary', 'Accept-Language')
  return (
    <html lang={localeTag(locale)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>tools.tf</title>
        <meta name="description" content={pick(locale, {
          en: 'A small collection of developer tools.',
          zh: '一组小而专注的开发者工具。',
        })} />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
        <link rel="icon" sizes="64x64" type="image/svg+xml" href="https://icon.tools.tf/icon/64?type=lucide&fg=%230f172a&bg=transparent&textGlyph=100&iconGlyph=100&radius=0&icon=tool-case" />
      </head>
      <body>{children}</body>
    </html>
  )
})
