import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient, Script } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>IP lookup · tools.tf</title>
        <meta
          name="description"
          content="Check your public IP address and edge location details."
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
