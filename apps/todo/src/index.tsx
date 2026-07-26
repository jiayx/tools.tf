import { Hono } from 'hono';
import { renderer } from './renderer';
import { parseTextToTasksWithAi, type WorkersAiBinding } from './server/ai-parser';
import { parseTextToTasksWithDeepSeek } from './server/deepseek-parser';
import { buildCalendar } from './server/ics';
import { normalizeCandidateForCreate, parseTextToTasks } from './server/parser';
import {
  computeStartByFromDue,
  formatUtcToZoned,
  getTaskStatus,
  isValidTimeZone,
  zonedDateTimeToUtc,
} from './server/scheduler';
import { makeId, store } from './server/store';
import { dbCreateTask, dbDeleteTask, dbGetAllTasks, dbGetTask, dbUpdateTask } from './server/db';
import type { D1Database } from '@cloudflare/workers-types';
import type { BatchCreateInput, ParseInput, TaskDue, TaskRecord, TaskStatus } from './server/types';

type CloudflareBindings = {
  DB: D1Database;
  AI?: WorkersAiBinding;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_GATEWAY_URL?: string;
};

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(renderer);

const isTaskStatus = (value: unknown): value is TaskStatus => {
  return value === 'upcoming_start' || value === 'upcoming_due' || value === 'in_progress' || value === 'completed';
};

const toClientTask = (task: TaskRecord) => {
  const due = task.due_at_utc && task.due_tz ? formatUtcToZoned(task.due_at_utc, task.due_tz) : null;
  const startBy = task.start_by_utc && task.start_by_tz ? formatUtcToZoned(task.start_by_utc, task.start_by_tz) : null;

  return {
    ...task,
    manual_status: task.manual_status ?? null,
    due,
    start_by: startBy,
    status: getTaskStatus(task),
  };
};

app.get('/api/health', (c) => {
  return c.json({ ok: true, now: new Date().toISOString() });
});

app.post('/api/parse', async (c) => {
  const body = (await c.req.json()) as ParseInput;

  if (!body.text || !body.text.trim()) {
    return c.json({ error: 'text 不能为空' }, 400);
  }

  const baseTimezone =
    body.base_timezone && isValidTimeZone(body.base_timezone)
      ? body.base_timezone
      : Intl.DateTimeFormat().resolvedOptions().timeZone;

  const locale = body.locale || 'zh-CN';

  let tasks: ReturnType<typeof parseTextToTasks> | null = null;
  let parseEngine: 'deepseek' | 'workers_ai' | 'heuristic' = 'heuristic';

  const hasDeepSeek = !!(c.env.DEEPSEEK_GATEWAY_URL && c.env.DEEPSEEK_API_KEY);
  console.log(`[parse] engines available — deepseek:${hasDeepSeek} workersAI:${!!c.env.AI}`);
  console.log(`[parse] input: "${body.text.slice(0, 120)}" | tz:${baseTimezone} locale:${locale}`);

  // 1. DeepSeek via Cloudflare AI Gateway (works in both dev and prod)
  if (c.env.DEEPSEEK_GATEWAY_URL && c.env.DEEPSEEK_API_KEY) {
    try {
      tasks = await parseTextToTasksWithDeepSeek({
        gatewayUrl: c.env.DEEPSEEK_GATEWAY_URL,
        apiKey: c.env.DEEPSEEK_API_KEY,
        text: body.text,
        baseTimezone,
        locale,
      });
      parseEngine = 'deepseek';
    } catch (err) {
      console.error('[parse] DeepSeek failed, falling back:', err);
      tasks = null;
    }
  }

  // 2. Workers AI fallback (Cloudflare Workers runtime only)
  if (!tasks && c.env.AI) {
    try {
      tasks = await parseTextToTasksWithAi({
        ai: c.env.AI,
        text: body.text,
        baseTimezone,
        locale,
      });
      parseEngine = 'workers_ai';
    } catch {
      tasks = null;
    }
  }

  // 3. Heuristic regex fallback
  if (!tasks) {
    console.log('[parse] using heuristic parser');
    tasks = parseTextToTasks(body.text, {
      baseTimezone,
      locale,
    });
  }

  console.log(`[parse] engine=${parseEngine} tasks=${tasks.length}`);
  for (const t of tasks) {
    console.log(`  task "${t.title}" | due: ${t.due ? `${t.due.date} ${t.due.time}` : 'null'} | flags: [${t.flags.join(', ')}]`);
  }

  const parseId = makeId('parse');
  store.parses.set(parseId, tasks);

  return c.json({
    parse_id: parseId,
    tasks,
    parse_engine: parseEngine,
  });
});

app.post('/api/tasks/batch', async (c) => {
  const body = (await c.req.json()) as BatchCreateInput;

  if (!body.parse_id || !Array.isArray(body.tasks_confirmed)) {
    return c.json({ error: 'parse_id 与 tasks_confirmed 必填' }, 400);
  }

  const existingTasks = await dbGetAllTasks(c.env.DB);
  const activeTasks = existingTasks
    .filter((t) => !t.completed)
    .map((t) => ({
      start_by_utc: t.start_by_utc,
      start_by_tz: t.start_by_tz,
      estimated_hours: t.estimated_hours,
    }));

  const created: TaskRecord[] = [];

  for (const candidate of body.tasks_confirmed) {
    try {
      const normalized = normalizeCandidateForCreate(candidate, activeTasks);
      const id = makeId('task');
      const nowIso = new Date().toISOString();

      const record: TaskRecord = {
        id,
        parse_id: body.parse_id,
        title: candidate.title.trim() || '未命名任务',
        context: candidate.context || '',
        due_at_utc: normalized.dueUtc,
        due_tz: normalized.due ? normalized.due.timezone : null,
        start_by_utc: normalized.startByUtc,
        start_by_tz: normalized.startBy ? normalized.startBy.timezone : null,
        complexity: normalized.complexity,
        estimated_hours: normalized.estimatedHours,
        steps: normalized.steps,
        confidence: candidate.confidence,
        flags: candidate.flags,
        start_by_locked: candidate.start_by_locked,
        manual_status: null,
        completed: false,
        created_at: nowIso,
        updated_at: nowIso,
      };

      await dbCreateTask(c.env.DB, record);
      created.push(record);

      activeTasks.push({
        start_by_utc: record.start_by_utc,
        start_by_tz: record.start_by_tz,
        estimated_hours: record.estimated_hours,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '任务创建失败';
      return c.json({ error: message }, 400);
    }
  }

  return c.json({
    tasks_created: created.map(toClientTask),
  });
});

app.get('/api/tasks', async (c) => {
  const status = c.req.query('status');
  const sortBy = c.req.query('sort');
  const tasks = await dbGetAllTasks(c.env.DB, sortBy);
  const data = tasks.map(toClientTask).filter((task) => (status ? task.status === status : true));

  return c.json({ tasks: data });
});

app.get('/api/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const task = await dbGetTask(c.env.DB, id);
  if (!task) {
    return c.json({ error: '任务不存在' }, 404);
  }
  return c.json({ task: toClientTask(task) });
});

app.patch('/api/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const task = await dbGetTask(c.env.DB, id);
  if (!task) {
    return c.json({ error: '任务不存在' }, 404);
  }

  const body = (await c.req.json()) as Partial<{
    title: string;
    context: string;
    due: TaskDue | null;
    complexity: number;
    estimated_hours: number;
    steps: TaskRecord['steps'];
    start_by: TaskDue | null;
    start_by_locked: boolean;
    completed: boolean;
    status: TaskStatus;
  }>;

  if (body.status !== undefined && !isTaskStatus(body.status)) {
    return c.json({ error: 'status 无效' }, 400);
  }

  const next: TaskRecord = {
    ...task,
    title: body.title !== undefined ? body.title.trim() || task.title : task.title,
    context: body.context !== undefined ? body.context : task.context,
    complexity: body.complexity !== undefined ? Math.max(1, Math.min(5, Math.round(body.complexity))) : task.complexity,
    estimated_hours:
      body.estimated_hours !== undefined ? Math.max(0.5, Number(body.estimated_hours)) : task.estimated_hours,
    start_by_locked: body.start_by_locked !== undefined ? Boolean(body.start_by_locked) : task.start_by_locked,
    completed: body.completed !== undefined ? Boolean(body.completed) : task.completed,
    manual_status: task.manual_status ?? null,
    updated_at: new Date().toISOString(),
  };

  if (body.status !== undefined) {
    if (body.status === 'completed') {
      next.completed = true;
      next.manual_status = 'completed';
    } else {
      next.completed = false;
      next.manual_status = body.status;
    }
  }

  if (body.completed !== undefined) {
    if (body.completed) {
      next.manual_status = 'completed';
    } else if (next.manual_status === 'completed') {
      next.manual_status = 'in_progress';
    }
  }

  if (body.steps) {
    if (body.steps.length < 3 || body.steps.length > 5) {
      return c.json({ error: 'steps 必须 3-5 条' }, 400);
    }
    next.steps = body.steps.map((step, index) => ({
      id: step.id || `step_${index + 1}`,
      title: step.title.trim() || `步骤 ${index + 1}`,
      estimated_hours: Math.max(0.3, Number(step.estimated_hours || 0.3)),
      done: Boolean(step.done),
    }));
  }

  if (body.due !== undefined) {
    if (body.due === null) {
      next.due_at_utc = null;
      next.due_tz = null;
      if (!next.start_by_locked) {
        next.start_by_utc = null;
        next.start_by_tz = null;
      }
    } else {
      next.due_at_utc = zonedDateTimeToUtc(body.due.date, body.due.time, body.due.timezone).toISOString();
      next.due_tz = body.due.timezone;

      if (!next.start_by_locked) {
        const suggestedStartBy = computeStartByFromDue(body.due, next.complexity, next.estimated_hours);
        next.start_by_utc = zonedDateTimeToUtc(
          suggestedStartBy.date,
          suggestedStartBy.time,
          suggestedStartBy.timezone
        ).toISOString();
        next.start_by_tz = suggestedStartBy.timezone;
      }
    }
  }

  if (body.start_by !== undefined) {
    if (body.start_by === null) {
      next.start_by_utc = null;
      next.start_by_tz = null;
    } else {
      next.start_by_utc = zonedDateTimeToUtc(
        body.start_by.date,
        body.start_by.time,
        body.start_by.timezone
      ).toISOString();
      next.start_by_tz = body.start_by.timezone;
    }
  }

  if (!next.start_by_locked && next.due_at_utc && next.due_tz && body.start_by === undefined) {
    const dueLocal = formatUtcToZoned(next.due_at_utc, next.due_tz);
    const suggestedStartBy = computeStartByFromDue(dueLocal, next.complexity, next.estimated_hours);
    next.start_by_utc = zonedDateTimeToUtc(
      suggestedStartBy.date,
      suggestedStartBy.time,
      suggestedStartBy.timezone
    ).toISOString();
    next.start_by_tz = suggestedStartBy.timezone;
  }

  await dbUpdateTask(c.env.DB, next);

  return c.json({ task: toClientTask(next) });
});

app.delete('/api/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const deleted = await dbDeleteTask(c.env.DB, id);
  if (!deleted) {
    return c.json({ error: '任务不存在' }, 404);
  }
  return c.json({ ok: true });
});

app.post('/api/tasks/:id/complete', async (c) => {
  const id = c.req.param('id');
  const task = await dbGetTask(c.env.DB, id);
  if (!task) {
    return c.json({ error: '任务不存在' }, 404);
  }

  const next: TaskRecord = {
    ...task,
    completed: true,
    manual_status: 'completed',
    updated_at: new Date().toISOString(),
  };

  await dbUpdateTask(c.env.DB, next);
  return c.json({ task: toClientTask(next) });
});

app.get('/api/export/ics', async (c) => {
  const scope = c.req.query('scope');
  const taskIdsQuery = c.req.query('task_ids');
  const taskIds = taskIdsQuery
    ? taskIdsQuery
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

  let tasks = await dbGetAllTasks(c.env.DB);

  if (scope !== 'all' && taskIds.length > 0) {
    tasks = tasks.filter((task) => taskIds.includes(task.id));
  }

  const ics = buildCalendar(tasks);

  c.header('Content-Type', 'text/calendar; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="taskflow.ics"');

  return c.body(ics);
});

app.get('*', (c) => {
  return c.render('');
});

export default app;
