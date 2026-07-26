/** @jsxImportSource react */
import { useState } from 'react';
import type { ParseCandidateTask, ParseResponse, TaskFlag } from '../types';
import { batchCreateTasks } from '../api';
import { FLAG_COLOR, FLAG_LABEL, complexityLabel, formatDue } from '../utils';
import { t } from '../i18n';

type Props = {
  result: ParseResponse;
  onConfirmed: () => void;
  onBack: () => void;
};

export function PreviewPage({ result, onConfirmed, onBack }: Props) {
  // Determine which tasks to select by default (exclude low-confidence ones)
  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(
        result.tasks
          .filter((t) => !t.flags.includes('LOW_CONFIDENCE'))
          .map((t) => t.id)
      )
  );
  const [tasks, setTasks] = useState<ParseCandidateTask[]>(result.tasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(tasks.map((t) => t.id)));
  }
  function selectNone() {
    setSelected(new Set());
  }

  function updateTask(id: string, patch: Partial<ParseCandidateTask>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function handleConfirm() {
    const confirmed = tasks.filter((t) => selected.has(t.id));
    if (confirmed.length === 0) {
      setError(t('Select at least one task', '请至少选择一个任务'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await batchCreateTasks(result.parse_id, confirmed);
      onConfirmed();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Creation failed. Try again.', '创建失败，请重试'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Header onBack={onBack} />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">{t('Parse preview', '解析预览')}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {t('Found ', '共识别到 ')}<span className="text-violet-400 font-medium">{tasks.length}</span>
              {t(' candidate tasks; ', ' 个候选任务，')}
              {t('selected ', '已选 ')}<span className="text-violet-400 font-medium">{selected.size}</span>
              {t('.', ' 个')}
              {result.parse_engine === 'workers_ai' && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs">
                  {t('AI engine', 'AI 引擎')}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={selectAll} className="text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
              {t('Select all', '全选')}
            </button>
            <button type="button" onClick={selectNone} className="text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
              {t('Select none', '全不选')}
            </button>
          </div>
        </div>

        {/* Task cards */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              selected={selected.has(task.id)}
              editing={editingId === task.id}
              onToggle={() => toggleSelect(task.id)}
              onEdit={() => setEditingId(task.id)}
              onClose={() => setEditingId(null)}
              onUpdate={(patch) => updateTask(task.id, patch)}
            />
          ))}
        </div>

        {/* Bottom action bar */}
        <div className="mt-8 flex items-center justify-between bg-gray-900 border border-white/8 rounded-2xl px-6 py-4">
          {error && <span className="text-sm text-red-400">{error}</span>}
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors cursor-pointer"
            >
              {t('Back to input', '返回重新输入')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || selected.size === 0}
              className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 cursor-pointer"
            >
              {loading
                ? t('Creating…', '创建中…')
                : t(`Create ${selected.size} tasks →`, `确认创建 ${selected.size} 个任务 →`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  selected,
  editing,
  onToggle,
  onEdit,
  onClose,
  onUpdate,
}: {
  task: ParseCandidateTask;
  selected: boolean;
  editing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onClose: () => void;
  onUpdate: (patch: Partial<ParseCandidateTask>) => void;
}) {
  const hasWarnings = task.flags.length > 0;
  const isLowConf = task.flags.includes('LOW_CONFIDENCE');

  return (
    <div
      className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${
        selected ? 'border-violet-500/40' : 'border-white/8'
      } ${isLowConf && !selected ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <button
          type="button"
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
            selected
              ? 'bg-violet-600 border-violet-600'
              : 'border-gray-600 hover:border-gray-400'
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <EditForm task={task} onUpdate={onUpdate} onClose={onClose} />
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-gray-100 leading-snug">{task.title}</h3>
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-xs text-gray-500 hover:text-violet-400 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0 cursor-pointer"
                >
                  {t('Edit', '编辑')}
                </button>
              </div>

              {task.context && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{task.context}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                <span>
                  {t('Due: ', '截止：')}<span className="text-gray-300">{task.due ? formatDue(task.due) : t('Not set', '未设置')}</span>
                </span>
                <span>
                  {t('Start: ', '开始：')}<span className="text-gray-300">{task.start_by ? formatDue(task.start_by) : '—'}</span>
                </span>
                <span>
                  {t('Complexity: ', '复杂度：')}<span className="text-gray-300">{complexityLabel(task.complexity)}</span>
                </span>
                <span>
                  {t('Duration: ', '耗时：')}<span className="text-gray-300">{task.estimated_hours}h</span>
                </span>
                <span>
                  {t('Confidence: ', '置信度：')}<span className={task.confidence >= 0.7 ? 'text-emerald-400' : 'text-orange-400'}>
                    {Math.round(task.confidence * 100)}%
                  </span>
                </span>
              </div>

              {/* Flags */}
              {hasWarnings && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {task.flags.map((flag) => (
                    <span
                      key={flag}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${FLAG_COLOR[flag as TaskFlag]}`}
                    >
                      {FLAG_LABEL[flag as TaskFlag]}
                    </span>
                  ))}
                </div>
              )}

              {/* Steps */}
              {task.steps.length > 0 && (
                <div className="mt-3 space-y-1">
                  {task.steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="text-gray-600">{i + 1}.</span>
                      <span>{step.title}</span>
                      <span className="ml-auto text-gray-600">{step.estimated_hours}h</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EditForm({
  task,
  onUpdate,
  onClose,
}: {
  task: ParseCandidateTask;
  onUpdate: (patch: Partial<ParseCandidateTask>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.due?.date ?? '');
  const [dueTime, setDueTime] = useState(task.due?.time ?? '');
  const [complexity, setComplexity] = useState(task.complexity);
  const [hours, setHours] = useState(task.estimated_hours);

  function save() {
    const patch: Partial<ParseCandidateTask> = {
      title,
      complexity,
      estimated_hours: hours,
    };
    if (dueDate) {
      patch.due = {
        date: dueDate,
        time: dueTime || '23:59',
        timezone: task.due?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        source_text: task.due?.source_text || '',
      };
    }
    onUpdate(patch);
    onClose();
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">{t('Title', '标题')}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-violet-500/50 transition-colors"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t('Due date', '截止日期')}</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t('Due time', '截止时间')}</label>
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t('Complexity (1-5)', '复杂度 (1-5)')}</label>
          <input
            type="number"
            min={1}
            max={5}
            value={complexity}
            onChange={(e) => setComplexity(Number(e.target.value))}
            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t('Estimated hours', '预估时长 (h)')}</label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={save}
          className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors cursor-pointer"
        >
          {t('Save', '保存')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 text-xs hover:bg-white/5 transition-colors cursor-pointer"
        >
          {t('Cancel', '取消')}
        </button>
      </div>
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
        TF
      </div>
      <span className="font-semibold text-lg tracking-tight">TaskFlow AI</span>
      <nav className="ml-6 flex items-center gap-1 text-sm">
        <button type="button" onClick={onBack} className="text-gray-500 hover:text-gray-300 px-2 py-1 rounded transition-colors cursor-pointer">
          {t('Import', '导入')}
        </button>
        <span className="text-gray-700">/</span>
        <span className="text-gray-200 px-2 py-1">{t('Parse preview', '解析预览')}</span>
      </nav>
    </header>
  );
}
