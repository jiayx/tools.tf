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
        <title>{pick(locale, { en: 'IP Lookup · tools.tf', zh: 'IP 查询 · tools.tf' })}</title>
        <meta
          name="description"
          content={pick(locale, {
            en: 'Check your public IP address and edge location details.',
            zh: '查看公网 IP 地址及 Cloudflare 边缘网络提供的位置详情。',
          })}
        />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
        <link
          rel="icon"
          sizes="64x64"
          type="image/svg+xml"
          href="https://icon.tools.tf/icon/64?type=tabler&fg=%230e4ee1&bg=transparent&textGlyph=100&iconGlyph=100&radius=0&icon=location-star"
        />
      </head>
      <body>
        {children}
        <Script type="module" src="/src/client.ts" />
      </body>
    </html>
  )
})
