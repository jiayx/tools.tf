import type { D1Database } from '@cloudflare/workers-types';
import type { TaskRecord, TaskStep, TaskFlag } from './types';

export type D1Env = { DB: D1Database };

// ── serialization helpers ───────────────────────────────────────────────────

function serializeSteps(steps: TaskStep[]): string {
  return JSON.stringify(steps);
}

function serializeFlags(flags: TaskFlag[]): string {
  return JSON.stringify(flags);
}

function deserialize(row: Record<string, unknown>): TaskRecord {
  return {
    id: row.id as string,
    parse_id: (row.parse_id as string | null) ?? null,
    title: row.title as string,
    context: (row.context as string) ?? '',
    due_at_utc: (row.due_at_utc as string | null) ?? null,
    due_tz: (row.due_tz as string | null) ?? null,
    start_by_utc: (row.start_by_utc as string | null) ?? null,
    start_by_tz: (row.start_by_tz as string | null) ?? null,
    complexity: row.complexity as number,
    estimated_hours: row.estimated_hours as number,
    steps: JSON.parse(row.steps as string) as TaskStep[],
    confidence: row.confidence as number,
    flags: JSON.parse(row.flags as string) as TaskFlag[],
    start_by_locked: Boolean(row.start_by_locked),
    manual_status: (row.manual_status as TaskRecord['manual_status']) ?? null,
    completed: Boolean(row.completed),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ── DAO functions ────────────────────────────────────────────────────────────

export async function dbGetAllTasks(db: D1Database, sortBy?: string): Promise<TaskRecord[]> {
  let orderBy = 'due_at_utc ASC NULLS LAST, created_at DESC';
  if (sortBy === 'created') orderBy = 'created_at DESC';
  if (sortBy === 'start_by') orderBy = 'start_by_utc ASC NULLS LAST, created_at DESC';

  const { results } = await db
    .prepare(`SELECT * FROM tasks ORDER BY ${orderBy}`)
    .all<Record<string, unknown>>();

  return results.map(deserialize);
}

export async function dbGetTask(db: D1Database, id: string): Promise<TaskRecord | null> {
  const row = await db
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .bind(id)
    .first<Record<string, unknown>>();

  return row ? deserialize(row) : null;
}

export async function dbCreateTask(db: D1Database, record: TaskRecord): Promise<void> {
  await db
    .prepare(`
      INSERT INTO tasks (
        id, parse_id, title, context,
        due_at_utc, due_tz, start_by_utc, start_by_tz,
        complexity, estimated_hours, steps, confidence,
        flags, start_by_locked, manual_status, completed,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `)
    .bind(
      record.id,
      record.parse_id,
      record.title,
      record.context,
      record.due_at_utc,
      record.due_tz,
      record.start_by_utc,
      record.start_by_tz,
      record.complexity,
      record.estimated_hours,
      serializeSteps(record.steps),
      record.confidence,
      serializeFlags(record.flags),
      record.start_by_locked ? 1 : 0,
      record.manual_status,
      record.completed ? 1 : 0,
      record.created_at,
      record.updated_at,
    )
    .run();
}

export async function dbUpdateTask(db: D1Database, record: TaskRecord): Promise<void> {
  await db
    .prepare(`
      UPDATE tasks SET
        title = ?, context = ?,
        due_at_utc = ?, due_tz = ?,
        start_by_utc = ?, start_by_tz = ?,
        complexity = ?, estimated_hours = ?,
        steps = ?, confidence = ?,
        flags = ?, start_by_locked = ?,
        manual_status = ?, completed = ?,
        updated_at = ?
      WHERE id = ?
    `)
    .bind(
      record.title,
      record.context,
      record.due_at_utc,
      record.due_tz,
      record.start_by_utc,
      record.start_by_tz,
      record.complexity,
      record.estimated_hours,
      serializeSteps(record.steps),
      record.confidence,
      serializeFlags(record.flags),
      record.start_by_locked ? 1 : 0,
      record.manual_status,
      record.completed ? 1 : 0,
      record.updated_at,
      record.id,
    )
    .run();
}

export async function dbDeleteTask(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM tasks WHERE id = ?')
    .bind(id)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function dbTaskExists(db: D1Database, id: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 FROM tasks WHERE id = ? LIMIT 1')
    .bind(id)
    .first();
  return row !== null;
}
