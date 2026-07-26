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
        <title>{pick(locale, { en: 'Timezone Converter · tools.tf', zh: '时区转换 · tools.tf' })}</title>
        <meta
          name="description"
          content={pick(locale, {
            en: 'Convert natural-language time descriptions across timezones instantly.',
            zh: '输入自然语言时间描述，即时完成跨时区换算。',
          })}
        />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
        <link rel="icon" sizes="64x64" type="image/svg+xml" href="https://icon.tools.tf/icon/64?type=tabler&fg=%231946ae&bg=transparent&glyph=100&icon=timezone" />
      </head>
      <body>
        {children}
        <Script type="module" src="/src/app.ts" />
      </body>
    </html>
  )
})
