/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, Script, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(() => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>密码生成器 · Password Generator</title>
        <meta name="description" content="在线密码生成器，支持自定义长度、字符类型，一键生成安全强密码并复制。" />
        <link rel="icon" type="image/png" href="https://icon.tools.tf/icon/128?type=lucide&fg=%2310b981&bg=transparent&textGlyph=100&iconGlyph=100&radius=0&icon=key-round" />
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
