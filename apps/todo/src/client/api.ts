/** @jsxImportSource react */
import type {
  BatchCreateResponse,
  ClientTask,
  ParseCandidateTask,
  ParseResponse,
  TaskDue,
  TaskResponse,
  TaskStep,
  TaskStatus,
  TasksResponse,
} from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** 解析文本，返回候选任务列表 */
export async function parseText(params: {
  text: string;
  base_timezone?: string;
  locale?: string;
}): Promise<ParseResponse> {
  return request<ParseResponse>('/api/parse', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** 批量确认并创建任务 */
export async function batchCreateTasks(
  parseId: string,
  tasks: ParseCandidateTask[]
): Promise<BatchCreateResponse> {
  return request<BatchCreateResponse>('/api/tasks/batch', {
    method: 'POST',
    body: JSON.stringify({ parse_id: parseId, tasks_confirmed: tasks }),
  });
}

/** 获取任务列表 */
export async function fetchTasks(params?: { status?: TaskStatus; sort?: string }): Promise<ClientTask[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.sort) qs.set('sort', params.sort);
  const url = `/api/tasks${qs.toString() ? `?${qs}` : ''}`;
  const data = await request<TasksResponse>(url);
  return data.tasks;
}

/** 获取单个任务 */
export async function fetchTask(id: string): Promise<ClientTask> {
  const data = await request<TaskResponse>(`/api/tasks/${id}`);
  return data.task;
}

/** 更新任务 */
export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    context: string;
    due: TaskDue | null;
    complexity: number;
    estimated_hours: number;
    steps: TaskStep[];
    start_by: TaskDue | null;
    start_by_locked: boolean;
    completed: boolean;
    status: TaskStatus;
  }>
): Promise<ClientTask> {
  const data = await request<TaskResponse>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return data.task;
}

/** 删除任务 */
export async function deleteTask(id: string): Promise<void> {
  await request<void>(`/api/tasks/${id}`, { method: 'DELETE' });
}

/** 完成任务 */
export async function completeTask(id: string): Promise<ClientTask> {
  const data = await request<TaskResponse>(`/api/tasks/${id}/complete`, {
    method: 'POST',
  });
  return data.task;
}

/** 导出 ICS */
export function buildIcsUrl(options?: { scope?: 'all'; taskIds?: string[] }): string {
  const qs = new URLSearchParams();
  if (options?.scope === 'all') {
    qs.set('scope', 'all');
  } else if (options?.taskIds?.length) {
    qs.set('task_ids', options.taskIds.join(','));
  }
  return `/api/export/ics${qs.toString() ? `?${qs}` : ''}`;
}
