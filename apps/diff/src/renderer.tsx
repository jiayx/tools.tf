/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, Script, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(() => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Diff · 文本差异对比</title>
        <meta name="description" content="输入两段文本，实时查看清晰、美观的差异对比。" />
        <link rel="icon" type="image/png" href="https://icon.tools.tf/icon/128?type=lucide&fg=%23a7d382&bg=transparent&textGlyph=100&iconGlyph=100&radius=0&icon=file-diff" />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>
        <div id="root"></div>
        <Script type="module" src="/src/main.tsx" />
      </body>
    </html>
  )
})
