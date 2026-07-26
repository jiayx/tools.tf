import { localeTag, pick, resolveLocale } from '@tools/i18n'
import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient, Script } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children }, c) => {
  const locale = resolveLocale(c.req.header('Accept-Language'))
  c.header('Vary', 'Accept-Language')
  return (
    <html lang={localeTag(locale)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <title>{pick(locale, { en: 'Icon Atelier · tools.tf', zh: '图标工坊 · tools.tf' })}</title>
        <meta
          name="description"
          content={pick(locale, {
            en: 'Create text, Lucide, Tabler, or Logos icons with gradients and instant previews.',
            zh: '使用文字、Lucide、Tabler 或品牌图标创建支持渐变和即时预览的图标。',
          })}
        />
        <ViteClient />
        <Link href="/src/ui/style.css" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="https://icon.tools.tf/icon/32?type=tabler&fg=%236366f1&bg1=%23111827&bg=transparent&angle=140&glyph=100&icon=icons" sizes="32x32" />
      </head>
      <body>
        {children}
        <Script type="module" src="/src/ui/client.ts" />
      </body>
    </html>
  )
})
