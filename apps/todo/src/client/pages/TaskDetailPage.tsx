/** @jsxImportSource react */
import { useEffect, useState } from 'react';
import { buildIcsUrl, deleteTask, fetchTask, updateTask } from '../api';
import type { ClientTask, TaskDue, TaskStep } from '../types';
import { FLAG_COLOR, FLAG_LABEL, STATUS_COLOR, STATUS_LABEL, complexityLabel, formatDue, isOverdue } from '../utils';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { t } from '../i18n';

type Props = {
  taskId: string;
  onBack: () => void;
  onNewImport: () => void;
};

export function TaskDetailPage({ taskId, onBack, onNewImport }: Props) {
  const [task, setTask] = useState<ClientTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const t = await fetchTask(taskId);
      setTask(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Failed to load task', '加载失败'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [taskId]);

  async function patch(updates: Parameters<typeof updateTask>[1]) {
    if (!task) return;
    setSaving(true);
    try {
      const updated = await updateTask(task.id, updates);
      setTask(updated);
      setEditingField(null);
    } catch {}
    setSaving(false);
  }

  async function toggleStep(step: TaskStep) {
    if (!task) return;
    const steps = task.steps.map((s) =>
      s.id === step.id ? { ...s, done: !s.done } : s
    );
    await patch({ steps });
  }

  async function toggleComplete() {
    if (!task) return;
    await patch({ completed: !task.completed });
  }

  function handleExport() {
    window.open(buildIcsUrl({ taskIds: [taskId] }), '_blank');
  }

  async function handleDelete() {
    if (!task) return;
    try {
      await deleteTask(task.id);
      onBack();
    } catch {}
  }

  const overdue = task ? isOverdue(task.due) && task.status !== 'completed' : false;
  const stepsDone = task?.steps.filter((s) => s.done).length ?? 0;
  const stepsTotal = task?.steps.length ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">
        {t('Loading…', '加载中…')}
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="text-red-400">{error || t('Task not found', '任务不存在')}</div>
        <button type="button" onClick={onBack} className="text-violet-400 hover:underline cursor-pointer">
          {t('Back to task library', '返回任务库')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
          TF
        </div>
        <span className="font-semibold text-lg tracking-tight">TaskFlow AI</span>
        <nav className="ml-6 flex items-center gap-1 text-sm">
          <button type="button" onClick={onNewImport} className="text-gray-500 hover:text-gray-300 px-2 py-1 rounded transition-colors cursor-pointer">
            {t('Import', '导入')}
          </button>
          <span className="text-gray-700">/</span>
          <button type="button" onClick={onBack} className="text-gray-500 hover:text-gray-300 px-2 py-1 rounded transition-colors cursor-pointer">
            {t('Task library', '任务库')}
          </button>
          <span className="text-gray-700">/</span>
          <span className="text-gray-200 px-2 py-1 max-w-[200px] truncate">{task.title}</span>
        </nav>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="ml-auto text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-red-500/20 hover:border-red-500/40"
          title={t('Delete task', '删除任务')}
        >
          {t('Delete task', '删除任务')}
        </button>
      </header>

      {showDeleteConfirm && task && (
        <ConfirmDialog
          title={t(`Delete “${task.title}”`, `删除「${task.title}」`)}
          message={t('This action cannot be undone. The task will be permanently deleted.', '此操作不可撤销，任务将被永久删除。')}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Title + Status */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-3">
            <EditableTitle
              value={task.title}
              onSave={(title) => patch({ title })}
            />
            {saving && <span className="text-xs text-gray-500 mt-2">{t('Saving…', '保存中…')}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[task.status]}`}>
              {STATUS_LABEL[task.status]}
            </span>
            {overdue && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full text-red-400 bg-red-400/10">
                {t('Overdue', '已逾期')}
              </span>
            )}
            {task.flags.map((flag) => (
              <span key={flag} className={`text-xs px-2.5 py-1 rounded-full ${FLAG_COLOR[flag]}`}>
                {FLAG_LABEL[flag]}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Time info */}
          <InfoCard title={t('Time', '时间信息')}>
            <InfoRow
              label={t('Due date', '截止时间')}
              value={task.due ? formatDue(task.due) : t('Not set', '未设置')}
              highlight={overdue}
              editing={editingField === 'due'}
              onEdit={() => setEditingField('due')}
            >
              {editingField === 'due' && (
                <DueEditor
                  current={task.due}
                  onSave={(due) => patch({ due })}
                  onCancel={() => setEditingField(null)}
                />
              )}
            </InfoRow>
            <InfoRow
              label={t('Latest start', '最晚开始')}
              value={task.start_by ? formatDue(task.start_by) : '—'}
              editing={editingField === 'start_by'}
              onEdit={() => setEditingField('start_by')}
            >
              {editingField === 'start_by' && (
                <DueEditor
                  current={task.start_by}
                  onSave={(start_by) => patch({ start_by })}
                  onCancel={() => setEditingField(null)}
                />
              )}
            </InfoRow>
            <InfoRow
              label={t('Start time mode', '时间锁定')}
              value={task.start_by_locked ? t('Locked manually', '已锁定（手动）') : t('Calculated automatically', '自动计算')}
            />
          </InfoCard>

          {/* Task meta */}
          <InfoCard title={t('Task details', '任务信息')}>
            <InfoRow
              label={t('Complexity', '复杂度')}
              value={`${complexityLabel(task.complexity)}（${task.complexity}/5）`}
              editing={editingField === 'complexity'}
              onEdit={() => setEditingField('complexity')}
            >
              {editingField === 'complexity' && (
                <NumberEditor
                  label={t('Complexity (1-5)', '复杂度 (1-5)')}
                  value={task.complexity}
                  min={1} max={5}
                  onSave={(v) => patch({ complexity: v })}
                  onCancel={() => setEditingField(null)}
                />
              )}
            </InfoRow>
            <InfoRow
              label={t('Estimated time', '预估耗时')}
              value={`${task.estimated_hours}h`}
              editing={editingField === 'hours'}
              onEdit={() => setEditingField('hours')}
            >
              {editingField === 'hours' && (
                <NumberEditor
                  label={t('Estimated time (h)', '预估耗时 (h)')}
                  value={task.estimated_hours}
                  min={0.5} step={0.5}
                  onSave={(v) => patch({ estimated_hours: v })}
                  onCancel={() => setEditingField(null)}
                />
              )}
            </InfoRow>
            <InfoRow
              label={t('Confidence', '置信度')}
              value={`${Math.round(task.confidence * 100)}%`}
            />
          </InfoCard>
        </div>

        {/* Steps */}
        <div className="bg-gray-900 border border-white/8 rounded-xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-sm">{t('Steps', '执行步骤')}</h3>
              <span className="text-xs text-gray-500">{stepsDone}/{stepsTotal} {t('complete', '完成')}</span>
            </div>
            {stepsTotal > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${stepsTotal > 0 ? (stepsDone / stepsTotal) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{stepsTotal > 0 ? Math.round((stepsDone / stepsTotal) * 100) : 0}%</span>
              </div>
            )}
          </div>

          <div className="divide-y divide-white/5">
            {task.steps.map((step, i) => (
              <StepRow
                key={step.id}
                step={step}
                index={i + 1}
                onToggle={() => toggleStep(step)}
              />
            ))}
            {task.steps.length === 0 && (
              <div className="px-5 py-6 text-sm text-gray-600 text-center">{t('No steps', '暂无步骤')}</div>
            )}
          </div>
        </div>

        {/* Context */}
        {task.context && (
          <div className="bg-gray-900 border border-white/8 rounded-xl px-5 py-4 mb-6">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">{t('Original context', '原始上下文')}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{task.context}</p>
          </div>
        )}

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleComplete}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              task.status === 'completed'
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
            }`}
          >
            {task.status === 'completed' ? t('↩ Mark incomplete', '↩ 取消完成') : t('✓ Mark complete', '✓ 标记完成')}
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/8 text-sm text-gray-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>📆</span>
            {t('Download .ics', '下载 .ics')}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors cursor-pointer ml-auto"
          >
            {t('← Back', '← 返回')}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepRow({ step, index, onToggle }: { step: TaskStep; index: number; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <button
        type="button"
        onClick={onToggle}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
          step.done
            ? 'bg-emerald-500/20 border-emerald-500/60'
            : 'border-gray-600 hover:border-emerald-400/60'
        }`}
        aria-label={step.done ? t('Mark incomplete', '取消完成') : t('Mark complete', '标记完成')}
      >
        {step.done && (
          <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M2 5l2.5 2.5 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span className="text-xs text-gray-600 w-4 flex-shrink-0">{index}.</span>
      <span className={`flex-1 text-sm ${step.done ? 'line-through text-gray-500' : 'text-gray-200'}`}>
        {step.title}
      </span>
      <span className="text-xs text-gray-600">{step.estimated_hours}h</span>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-white/8 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
  editing,
  onEdit,
  children,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  editing?: boolean;
  onEdit?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${highlight ? 'text-red-400' : 'text-gray-200'}`}>{value}</span>
          {onEdit && !editing && (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs text-gray-600 hover:text-violet-400 transition-colors cursor-pointer"
            >
              {t('Edit', '编辑')}
            </button>
          )}
        </div>
      </div>
      {editing && children}
    </div>
  );
}

function EditableTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex-1 flex items-start gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          className="flex-1 text-2xl font-bold bg-gray-900 border border-violet-500/50 rounded-lg px-3 py-1 text-gray-100 outline-none"
        />
        <button type="button" onClick={() => { onSave(draft); setEditing(false); }} className="mt-2 text-xs text-violet-400 hover:underline cursor-pointer">
          {t('Save', '保存')}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="mt-2 text-xs text-gray-500 hover:underline cursor-pointer">
          {t('Cancel', '取消')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 flex-1">
      <h1 className="text-2xl font-bold text-gray-100 leading-tight">{value}</h1>
      <button
        type="button"
        onClick={() => { setDraft(value); setEditing(true); }}
        className="mt-1 text-xs text-gray-600 hover:text-violet-400 transition-colors cursor-pointer"
      >
        {t('Edit', '编辑')}
      </button>
    </div>
  );
}

function DueEditor({
  current,
  onSave,
  onCancel,
}: {
  current: TaskDue | null;
  onSave: (due: TaskDue | null) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(current?.date ?? '');
  const [time, setTime] = useState(current?.time ?? '');

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-gray-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-100 outline-none focus:border-violet-500/50"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="bg-gray-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-100 outline-none focus:border-violet-500/50"
      />
      <button
        type="button"
        onClick={() => {
          if (!date) { onSave(null); return; }
          onSave({
            date,
            time: time || '23:59',
            timezone: current?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            source_text: current?.source_text || '',
          });
        }}
        className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors cursor-pointer"
      >
        {t('Save', '保存')}
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer">
        {t('Cancel', '取消')}
      </button>
    </div>
  );
}

function NumberEditor({
  label,
  value,
  min,
  max,
  step,
  onSave,
  onCancel,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onSave: (v: number) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(value);
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="number"
        value={v}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setV(Number(e.target.value))}
        className="w-24 bg-gray-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-100 outline-none focus:border-violet-500/50"
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => onSave(v)}
        className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors cursor-pointer"
      >
        {t('Save', '保存')}
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer">
        {t('Cancel', '取消')}
      </button>
    </div>
  );
}
