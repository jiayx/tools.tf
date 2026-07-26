/** @jsxImportSource hono/jsx */
import { localeTag, pick, resolveLocale } from '@tools/i18n';
import { jsxRenderer } from 'hono/jsx-renderer';
import { Link, Script, ViteClient } from 'vite-ssr-components/hono';

export const renderer = jsxRenderer((_, c) => {
  const locale = resolveLocale(c.req.header('Accept-Language'));
  c.header('Vary', 'Accept-Language');
  return (
    <html lang={localeTag(locale)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{pick(locale, { en: 'TaskFlow AI · Task Planner', zh: 'TaskFlow AI · 任务规划工具' })}</title>
        <meta name="description" content={pick(locale, {
          en: 'Turn syllabi, messages, or notes into actionable tasks with start-by dates and calendar export.',
          zh: '粘贴 syllabus、群消息或备忘录，自动拆解任务、计算 start-by 并导出日历。',
        })} />
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
