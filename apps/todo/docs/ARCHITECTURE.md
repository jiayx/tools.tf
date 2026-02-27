# Architecture Notes

## Runtime

- Cloudflare Worker (Hono app)
- 同一进程提供：
  - API (`/api/*`)
  - 前端入口 HTML（挂载 React SPA）

## 前端

- React + TanStack Router
- 四个页面路由：
  - `/`
  - `/preview`
  - `/tasks`
  - `/tasks/:taskId`

## 后端模块

- `server/ai-parser.ts`：Cloudflare Workers AI 解析（结构化输出 + 严格归一化）
- `server/parser.ts`：规则解析兜底（AI 不可用或失败时启用）
- `server/scheduler.ts`：时区转换、start-by 计算、状态分组
- `server/ics.ts`：日历导出
- `server/store.ts`：MVP 内存存储

## 数据流

1. 用户粘贴文本 -> `POST /api/parse`（优先 Workers AI，失败自动回退规则解析）
2. 预览纠错后批量确认 -> `POST /api/tasks/batch`
3. 任务执行与编辑 -> `GET/PATCH /api/tasks/*`
4. 导出提醒 -> `GET /api/export/ics`

## 持久化替换位

当前 `Map` 内存存储，可在后续替换为：

1. Cloudflare D1（任务主表 + 步骤表）
2. KV（解析缓存）
3. R2（历史导出文件可选）
