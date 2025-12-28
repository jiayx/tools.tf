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
          content="Create text, Lucide, Tabler, or Logos icons with gradients and instant previews."
        />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
        <link rel="icon" type="image/svg+xml" href="https://icon.tools.tf/icon/32?type=tabler&fg=%236366f1&bg1=%23111827&bg=transparent&angle=140&glyph=100&icon=icons" sizes="32x32" />
      </head>
      <body>
        {children}
        <Script type="module" src="/src/client.ts" />
      </body>
    </html>
  )
})
