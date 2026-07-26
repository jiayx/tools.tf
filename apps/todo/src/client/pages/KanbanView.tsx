/** @jsxImportSource react */
import { useState } from 'react';
import type { ClientTask, TaskStatus } from '../types';
import { STATUS_COLOR, STATUS_LABEL, formatDue, isOverdue, hasWarnFlag, warnFlagTip } from '../utils';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { t } from '../i18n';

const COLUMNS: TaskStatus[] = ['upcoming_start', 'in_progress', 'upcoming_due', 'completed'];

type Props = {
  tasks: ClientTask[];
  onTaskClick: (id: string) => void;
  onComplete: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onDelete: (id: string) => void;
};

export function KanbanView({ tasks, onTaskClick, onComplete, onStatusChange, onDelete }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const grouped = Object.fromEntries(
    COLUMNS.map((s) => [s, tasks.filter((t) => t.status === s)])
  ) as Record<TaskStatus, ClientTask[]>;

  function handleDragStart(id: string) {
    setDraggedId(id);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverStatus(null);
  }

  function handleDrop(targetStatus: TaskStatus) {
    if (!draggedId) return;
    const task = tasks.find((t) => t.id === draggedId);
    if (task && task.status !== targetStatus) {
      onStatusChange(draggedId, targetStatus);
    }
    setDraggedId(null);
    setDragOverStatus(null);
  }

  const draggedTask = draggedId ? tasks.find((t) => t.id === draggedId) : null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full" style={{ minHeight: '70vh' }}>
      {COLUMNS.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={grouped[status]}
          isDragOver={dragOverStatus === status}
          draggedStatus={draggedTask?.status ?? null}
          onTaskClick={onTaskClick}
          onComplete={onComplete}
          onDelete={onDelete}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={() => setDragOverStatus(status)}
          onDragLeave={() => setDragOverStatus((prev) => (prev === status ? null : prev))}
          onDrop={() => handleDrop(status)}
        />
      ))}
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  isDragOver,
  draggedStatus,
  onTaskClick,
  onComplete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDelete,
}: {
  status: TaskStatus;
  tasks: ClientTask[];
  isDragOver: boolean;
  draggedStatus: TaskStatus | null;
  onTaskClick: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
}) {
  const isSameColumn = draggedStatus === status;

  return (
    <div className="flex flex-col flex-1 min-w-64">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        <span className="text-xs text-gray-600 font-medium tabular-nums">{tasks.length}</span>
      </div>

      {/* Column body — drop target */}
      <div
        className={`flex-1 rounded-xl p-2 space-y-2 border transition-colors ${
          isDragOver && !isSameColumn
            ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/20'
            : tasks.length === 0 && draggedStatus === null
            ? 'border-dashed border-white/8'
            : 'bg-gray-900/40 border-transparent'
        }`}
        onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
        onDragLeave={onDragLeave}
        onDrop={(e) => { e.preventDefault(); onDrop(); }}
      >
        {tasks.length === 0 && draggedStatus === null && (
          <div className="flex items-center justify-center h-24 text-xs text-gray-700">
            {t('No tasks', '暂无任务')}
          </div>
        )}
        {isDragOver && !isSameColumn && tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-violet-500/60">
            {t('Drop to move here', '松开以移入')}
          </div>
        )}
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task.id)}
            onComplete={() => onComplete(task.id)}
            onDelete={() => onDelete(task.id)}
            onDragStart={() => onDragStart(task.id)}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({
  task,
  onClick,
  onComplete,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  task: ClientTask;
  onClick: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const overdue = isOverdue(task.due) && task.status !== 'completed';
  const stepsTotal = task.steps.length;
  const stepsDone = task.steps.filter((s) => s.done).length;
  const progress = stepsTotal > 0 ? stepsDone / stepsTotal : 0;
  const [dragging, setDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
        onDragStart();
      }}
      onDragEnd={() => {
        setDragging(false);
        onDragEnd();
      }}
      className={`bg-gray-900 border rounded-xl p-3 transition-all group hover:border-white/15 hover:shadow-lg hover:shadow-black/20 select-none ${
        task.status === 'completed' ? 'border-white/5 opacity-60' : 'border-white/8'
      } ${dragging ? 'opacity-40 scale-95 cursor-grabbing' : 'cursor-grab'}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
    >
      {/* Drag handle hint */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <span className="text-gray-700 mt-0.5 flex-shrink-0 text-xs leading-none">⠿</span>
          <span
            className={`text-sm font-medium leading-snug ${
              task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-100'
            }`}
          >
            {task.title}
          </span>
        </div>
        {hasWarnFlag(task.flags) && (
          <span
            className="text-yellow-500 text-xs flex-shrink-0 mt-0.5 cursor-help"
            title={warnFlagTip(task.flags)}
          >
            ⚠️
          </span>
        )}
      </div>

      {/* Due date */}
      {task.due && (
        <div className={`text-xs mb-2 flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
          <span>{overdue ? '🔴' : '📅'}</span>
          <span>{formatDue(task.due)}</span>
        </div>
      )}

      {/* Start-by */}
      {task.start_by && task.status !== 'completed' && (
        <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
          <span>⏱</span>
          <span>{t('Start', '开始')} {formatDue(task.start_by)}</span>
        </div>
      )}

      {/* Progress bar */}
      {stepsTotal > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{stepsDone}/{stepsTotal} {t('steps', '步骤')}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <ComplexityDots value={task.complexity} />
          <span className="text-xs text-gray-600">{task.estimated_hours}h</span>
        </div>

        <div className="flex items-center gap-1">
          {task.status !== 'completed' && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onComplete(); }}
              className="text-xs text-gray-600 hover:text-emerald-400 transition-colors px-1.5 py-0.5 rounded hover:bg-emerald-400/10 cursor-pointer"
              aria-label={t('Mark complete', '标记完成')}
            >
              ✓
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className="text-xs text-gray-700 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-red-400/10 cursor-pointer opacity-0 group-hover:opacity-100"
            aria-label={t('Delete', '删除')}
          >
            ✕
          </button>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title={t(`Delete “${task.title}”`, `删除「${task.title}」`)}
          message={t('This action cannot be undone. The task will be permanently deleted.', '此操作不可撤销，任务将被永久删除。')}
          onConfirm={() => { setConfirmOpen(false); onDelete(); }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

function ComplexityDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" title={t(`Complexity ${value}/5`, `复杂度 ${value}/5`)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= value ? 'bg-violet-500' : 'bg-gray-700'}`}
        />
      ))}
    </div>
  );
}
