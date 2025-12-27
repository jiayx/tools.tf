import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient, Script } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />
        <title>Icon Atelier · tools.tf</title>
        <meta
          name="description"
          content="Create text, Lucide, or Tabler icons with gradients and instant previews."
        />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="https://favicon.tools.tf/icon/32?type=icon&fg=%23f8fafc&bg1=%23111827&bg2=%236366f1&angle=140&glyph=64&icon=image" sizes="32x32" />
      </head>
      <body>
        {children}
        <Script type="module" src="/src/client.ts" />
      </body>
    </html>
  )
})
