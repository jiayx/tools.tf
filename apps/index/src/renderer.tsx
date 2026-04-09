import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>tools.tf</title>
        <meta name="description" content="A small collection of dev tools." />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
        <link rel="icon" sizes="64x64" type="image/svg+xml" href="https://icon.tools.tf/icon/64?type=lucide&fg=%230f172a&bg=transparent&textGlyph=100&iconGlyph=100&radius=0&icon=tool-case" />
      </head>
      <body>{children}</body>
    </html>
  )
})
