/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, Script, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(() => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>JSON 格式化 · JSON Formatter</title>
        <meta name="description" content="在线 JSON 格式化、校验与高亮工具，支持折叠、压缩、复制。" />
        <link rel="icon" type="image/png" href="https://icon.tools.tf/icon/128?type=lucide&fg=%238b5cf6&bg=transparent&iconGlyph=100&icon=braces" />
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
