import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient, Script } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>跨时区时间助手 · chrono</title>
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
        <Script src="/src/app.ts" type="module" />
      </head>
      <body>{children}</body>
    </html>
  )
})
