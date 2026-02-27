# TaskFlow AI (MVP)

面向学生与忙碌人群的 AI 任务规划工具。将一段自然语言文本解析成任务系统，并支持 `.ics` 导出形成提醒闭环。

## 技术选型

这版优先选择：

- `React`：前端交互与页面状态
- `Hono`：Cloudflare Worker API 与页面入口
- `@tanstack/react-router`：前端路由（导入 / 预览 / 任务库 / 详情）

未使用 `TanStack Start`，原因是当前 MVP 更偏 API + SPA 形态，部署到 Cloudflare 的链路更简单，后续可平滑升级。

## 功能范围（当前实现）

- 文本解析：优先 Cloudflare Workers AI，失败自动回退规则引擎
- 解析输出：任务标题、due、复杂度、估时、3-5 步步骤
- 默认补时规则：
  - 仅日期 -> `23:59`
  - `周五前 / 今晚前 / before` -> `18:00`
  - `上午 / 早上` -> `09:00`
  - `晚上 / 今晚` -> `20:00`
- 歧义标记：`DATE_AMBIGUOUS`（如 `2/3`）
- `start-by` 计算：
  - 每日有效投入按 `2h`
  - `lead_days = max(ceil(estimated_hours / 2), min_lead_days_by_complexity)`
  - 复杂度最小提前：低 `1` / 中 `3` / 高 `5`
- 解析预览页：批量确认、逐项编辑、低置信度默认不勾选
- 任务库：分组展示、搜索筛选、快速编辑 due / start-by、完成任务
- 详情页：步骤勾选、下载本任务或全部任务 `.ics`
- ICS 导出：每任务 2 个事件（Start-by + Due）

## 项目结构

```text
apps/todo/
  docs/
    PRD.md
    DEV_PLAN.md
    API.md
  src/
    client/
      api.ts
      app.tsx
      types.ts
      utils.ts
    server/
      ics.ts
      parser.ts
      scheduler.ts
      store.ts
      types.ts
    index.tsx
    main.tsx
    renderer.tsx
    style.css
```

## 本地开发

```bash
pnpm install
pnpm --filter todo dev
```

## 部署

```bash
pnpm --filter todo build
pnpm --filter todo deploy
```

## 已知限制

- 当前数据存储为 Worker 进程内存（重启会丢失）
- AI 解析依赖 Cloudflare Workers AI 配额与模型可用性
- 未实现鉴权 / 多用户隔离
- 未实现步骤级提醒与原生推送
