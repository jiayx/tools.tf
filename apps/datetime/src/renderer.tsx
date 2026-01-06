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
        <link rel="icon" sizes="64x64" type="image/svg+xml" href="https://icon.tools.tf/icon/64?type=tabler&fg=%231946ae&bg=transparent&glyph=100&icon=timezone" />
      </head>
      <body>
        {children}
        <Script src="/src/app.ts" type="module" />
      </body>
    </html>
  )
})
