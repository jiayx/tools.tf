# API Contract (MVP)

Base URL: `/api`

## 1) Parse

`POST /api/parse`

说明：

- 默认优先使用 Cloudflare Workers AI（`AI` binding）进行结构化解析。
- 当 AI 不可用、模型调用失败或返回非法 JSON 时，自动回退到规则解析引擎。
- 响应中的 `parse_engine` 用于标识本次实际引擎：`workers_ai` 或 `heuristic`。

Request:

```json
{
  "text": "3/5 交数据库作业，周五前完成演示稿",
  "base_timezone": "Asia/Singapore",
  "locale": "zh-CN"
}
```

Response:

```json
{
  "parse_id": "parse_xxx",
  "parse_engine": "workers_ai",
  "tasks": [
    {
      "id": "candidate_xxx",
      "title": "数据库作业",
      "context": "",
      "due": {
        "date": "2026-03-05",
        "time": "23:59",
        "timezone": "Asia/Singapore",
        "source_text": "3/5 交数据库作业"
      },
      "complexity": 4,
      "estimated_hours": 6.5,
      "steps": [
        {"id":"step_1","title":"读需求并拆分任务","estimated_hours":1,"done":false}
      ],
      "confidence": 0.8,
      "flags": ["DATE_AMBIGUOUS", "MISSING_TIME_DEFAULTED"],
      "start_by": {
        "date": "2026-03-02",
        "time": "23:59",
        "timezone": "Asia/Singapore",
        "source_text": "auto_from_due_minus_3_days"
      },
      "start_by_locked": false
    }
  ]
}
```

## 2) Batch Create

`POST /api/tasks/batch`

Request:

```json
{
  "parse_id": "parse_xxx",
  "tasks_confirmed": [
    {"id":"candidate_xxx", "title":"..."}
  ]
}
```

Response:

```json
{
  "tasks_created": [
    {
      "id": "task_xxx",
      "title": "数据库作业",
      "due_at_utc": "2026-03-05T15:59:00.000Z",
      "start_by_utc": "2026-03-02T15:59:00.000Z",
      "due": {"date":"2026-03-05","time":"23:59","timezone":"Asia/Singapore","source_text":"derived"},
      "start_by": {"date":"2026-03-02","time":"23:59","timezone":"Asia/Singapore","source_text":"derived"},
      "status": "in_progress"
    }
  ]
}
```

## 3) List Tasks

`GET /api/tasks?status=&sort=`

- `status`: `upcoming_start` | `upcoming_due` | `in_progress` | `completed`
- `sort`: `due` (default) | `start_by` | `created`

## 4) Get Task

`GET /api/tasks/:id`

## 5) Update Task

`PATCH /api/tasks/:id`

Payload (partial):

```json
{
  "title": "新标题",
  "due": {
    "date": "2026-03-06",
    "time": "20:00",
    "timezone": "Asia/Singapore",
    "source_text": "edited_by_user"
  },
  "start_by": {
    "date": "2026-03-03",
    "time": "20:00",
    "timezone": "Asia/Singapore",
    "source_text": "edited_by_user"
  },
  "start_by_locked": true,
  "complexity": 4,
  "estimated_hours": 7,
  "steps": [
    {"id":"step_1", "title":"步骤1", "estimated_hours":1.5, "done":false}
  ]
}
```

## 6) Complete Task

`POST /api/tasks/:id/complete`

## 7) Export ICS

- 全量：`GET /api/export/ics?scope=all`
- 指定任务：`GET /api/export/ics?task_ids=task_a,task_b`

Response Content-Type: `text/calendar`
