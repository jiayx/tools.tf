/** @jsxImportSource hono/jsx */
import { jsxRenderer } from 'hono/jsx-renderer';
import { Link, Script, ViteClient } from 'vite-ssr-components/hono';

export const renderer = jsxRenderer(() => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>TaskFlow AI · 任务规划工具</title>
        <meta name="description" content="粘贴 syllabus、群消息或备忘录，自动拆解任务、计算 start-by 并导出日历。" />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>
        <div id="root"></div>
        <Script type="module" src="/src/main.tsx" />
      </body>
    </html>
  );
});
