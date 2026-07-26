/** @jsxImportSource react */
import { useCallback, useEffect, useState } from 'react';
import { deleteTask, fetchTasks, updateTask, buildIcsUrl } from '../api';
import type { ClientTask, TaskStatus } from '../types';
import { STATUS_COLOR, STATUS_LABEL, complexityLabel, formatDue, isOverdue, hasWarnFlag, warnFlagTip } from '../utils';
import { KanbanView } from './KanbanView';
import { t } from '../i18n';

type Props = {
  onTaskClick: (id: string) => void;
  onNewImport: () => void;
};

const STATUS_ORDER: TaskStatus[] = ['in_progress', 'upcoming_due', 'upcoming_start', 'completed'];

export function TasksPage({ onTaskClick, onNewImport }: Props) {
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'due' | 'start_by' | 'created'>('due');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks({ sort: sortBy });
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Failed to load tasks', '加载失败'));
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = tasks.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.context.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by status
  const grouped = Object.fromEntries(
    STATUS_ORDER.map((s) => [s, filtered.filter((t) => t.status === s)])
  ) as Record<TaskStatus, ClientTask[]>;

  async function handleComplete(id: string) {
    try {
      const updated = await updateTask(id, { completed: true });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {}
  }

  async function handleStatusChange(id: string, newStatus: import('../types').TaskStatus) {
    try {
      const updated = await updateTask(id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {}
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  }

  function handleExportAll() {
    window.open(buildIcsUrl({ scope: 'all' }), '_blank');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Header onNewImport={onNewImport} />

      <div className="flex-1 w-full px-6 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {STATUS_ORDER.map((s) => {
            const count = tasks.filter((t) => t.status === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus((prev) => (prev === s ? 'all' : s))}
                className={`bg-gray-900 border rounded-xl px-4 py-3 text-left transition-all cursor-pointer ${
                  filterStatus === s ? 'border-violet-500/40' : 'border-white/8 hover:border-white/12'
                }`}
              >
                <div className="text-2xl font-bold text-gray-100">{count}</div>
                <div className={`text-xs mt-0.5 font-medium ${STATUS_COLOR[s].split(' ')[0]}`}>
                  {STATUS_LABEL[s]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search tasks…', '搜索任务…')}
              className="w-full bg-gray-900 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-violet-500/40 transition-colors"
            />
          </div>

          {viewMode === 'list' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">{t('Sort', '排序')}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs bg-gray-900 border border-white/8 rounded-lg px-2 py-2 text-gray-300 outline-none focus:border-violet-500/40 transition-colors cursor-pointer"
              >
                <option value="due">{t('Due date', '截止时间')}</option>
                <option value="start_by">{t('Start date', '开始时间')}</option>
                <option value="created">{t('Created date', '创建时间')}</option>
              </select>
            </div>
          )}

          {/* View toggle */}
          <div className="flex items-center bg-gray-900 border border-white/8 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title={t('List view', '列表视图')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ListIcon />
              {t('List', '列表')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              title={t('Board view', '泳道视图')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <KanbanIcon />
              {t('Board', '泳道')}
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportAll}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/8 text-sm text-gray-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>📆</span>
            {t('Export all as ICS', '导出全部 ICS')}
          </button>
        </div>

        {loading && (
          <div className="text-center py-20 text-gray-500">{t('Loading…', '加载中…')}</div>
        )}
        {error && (
          <div className="text-center py-20 text-red-400">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState hasFilters={search !== '' || filterStatus !== 'all'} onNewImport={onNewImport} />
        )}

        {!loading && !error && filtered.length > 0 && viewMode === 'kanban' && (
          <KanbanView
            tasks={filtered}
            onTaskClick={onTaskClick}
            onComplete={handleComplete}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}

        {!loading && !error && filtered.length > 0 && viewMode === 'list' && (
          <div className="space-y-8">
            {STATUS_ORDER.map((s) => {
              const group = grouped[s];
              if (group.length === 0) return null;
              return (
                <section key={s}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[s]}`}>
                      {STATUS_LABEL[s]}
                    </span>
                    <span className="text-xs text-gray-600">{t(`${group.length} tasks`, `${group.length} 个`)}</span>
                  </div>
                  <div className="space-y-2">
                    {group.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick(task.id)}
                        onComplete={() => handleComplete(task.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onClick,
  onComplete,
}: {
  task: ClientTask;
  onClick: () => void;
  onComplete: () => void;
}) {
  const overdue = isOverdue(task.due) && task.status !== 'completed';
  const stepsTotal = task.steps.length;
  const stepsDone = task.steps.filter((s) => s.done).length;

  return (
    <div
      className="group bg-gray-900 border border-white/8 hover:border-white/15 rounded-xl px-4 py-3 flex items-center gap-3 transition-all cursor-pointer"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
    >
      {/* Complete button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
        disabled={task.status === 'completed'}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
          task.status === 'completed'
            ? 'bg-emerald-500/20 border-emerald-500/60'
            : 'border-gray-600 hover:border-emerald-500/60'
        }`}
        aria-label={t('Complete task', '完成任务')}
      >
        {task.status === 'completed' && (
          <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 5l2.5 2.5 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
            {task.title}
          </span>
          {hasWarnFlag(task.flags) && (
            <span
              className="text-yellow-500 text-xs flex-shrink-0 cursor-help"
              title={warnFlagTip(task.flags)}
            >
              ⚠️
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
          {task.due && (
            <span className={overdue ? 'text-red-400' : ''}>
              {t('Due', '截止')} {formatDue(task.due)}
            </span>
          )}
          {task.start_by && (
            <span>{t('Start', '开始')} {formatDue(task.start_by)}</span>
          )}
          {stepsTotal > 0 && (
            <span>{stepsDone}/{stepsTotal} {t('steps', '步骤')}</span>
          )}
          <span>{complexityLabel(task.complexity)} · {task.estimated_hours}h</span>
        </div>
      </div>

      {/* Progress bar */}
      {stepsTotal > 0 && (
        <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: `${(stepsDone / stepsTotal) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{Math.round((stepsDone / stepsTotal) * 100)}%</span>
        </div>
      )}

      <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function EmptyState({ hasFilters, onNewImport }: { hasFilters: boolean; onNewImport: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">{hasFilters ? '🔍' : '📭'}</div>
      <h3 className="text-lg font-medium text-gray-300 mb-2">
        {hasFilters ? t('No matching tasks', '没有匹配的任务') : t('The task library is empty', '任务库为空')}
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        {hasFilters ? t('Try adjusting your search', '尝试调整搜索条件') : t('Import some tasks to get started', '先导入一些任务吧')}
      </p>
      {!hasFilters && (
        <button
          type="button"
          onClick={onNewImport}
          className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all cursor-pointer"
        >
          {t('Start importing →', '开始导入 →')}
        </button>
      )}
    </div>
  );
}

function Header({ onNewImport }: { onNewImport: () => void }) {
  return (
    <header className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
        TF
      </div>
      <span className="font-semibold text-lg tracking-tight">TaskFlow AI</span>
      <nav className="ml-6 flex items-center gap-1 text-sm">
        <button
          type="button"
          onClick={onNewImport}
          className="text-gray-500 hover:text-gray-300 px-2 py-1 rounded transition-colors cursor-pointer"
        >
          {t('Import', '导入')}
        </button>
        <span className="text-gray-700">/</span>
        <span className="text-gray-200 px-2 py-1">{t('Task library', '任务库')}</span>
      </nav>
      <button
        type="button"
        onClick={onNewImport}
        className="ml-auto px-4 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 text-sm font-medium transition-all cursor-pointer"
      >
        {t('+ New import', '+ 新建导入')}
      </button>
    </header>
  );
}

function ListIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function KanbanIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="3" height="12" rx="1" fill="currentColor" />
      <rect x="5.5" y="1" width="3" height="8" rx="1" fill="currentColor" />
      <rect x="10" y="1" width="3" height="10" rx="1" fill="currentColor" />
    </svg>
  );
}
