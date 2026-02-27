# Development Plan - TaskFlow AI MVP

## Phase 0: 基础工程

1. 建立 `apps/todo` package 与 Cloudflare Worker 入口。
2. 配置 React + Vite + pnpm workspace。
3. 建立 Hono API 与前端路由骨架。

## Phase 1: 解析与后处理

1. 接入 Cloudflare Workers AI 作为主解析引擎，输出结构化任务 JSON。
2. 保留规则解析作为兜底，确保 AI 不可用时仍可创建任务。
3. 文本分行与任务候选筛选。
4. 时间表达提取：
   - 日期：`yyyy-mm-dd` / `m/d` / `m月d日` / `周X` / `下周X` / 明天/后天
   - 时间：`HH:mm` / `X点` / `X点半` / 上午下午
5. 默认补时与 flag 标记。
6. 复杂度和估时启发式计算。
7. 3-5 步步骤生成及耗时归一。
8. start-by 规则计算。

## Phase 2: 业务 API

1. `POST /api/parse`
2. `POST /api/tasks/batch`
3. `GET /api/tasks`
4. `GET /api/tasks/:id`
5. `PATCH /api/tasks/:id`
6. `POST /api/tasks/:id/complete`
7. `GET /api/export/ics`

## Phase 3: 前端交互

1. 导入页：输入文本 + 解析参数。
2. 解析预览页：批改字段、flag 展示、批量创建。
3. 任务库：分组视图、搜索筛选、快速编辑。
4. 任务详情：步骤勾选与 ICS 下载。

## Phase 4: 质量保障

1. 时间转换与 DST 场景单测（后续补）。
2. 解析规则回归样例集（后续补）。
3. API 合约测试（后续补）。

## 后续迭代建议

1. 将启发式解析升级到 LLM + 规则双引擎。
2. 引入 D1 / KV 实现持久化与多用户。
3. 支持 OAuth + 用户时区偏好。
4. 支持 webhook 导出（Google/Apple 订阅链接）。
