/** @jsxImportSource react */
import type { TaskDue, TaskFlag, TaskStatus } from './types';

/** 格式化 TaskDue 为可读字符串 */
export function formatDue(due: TaskDue | null | undefined): string {
  if (!due) return '—';
  return `${due.date} ${due.time}`;
}

/** 状态标签 */
export const STATUS_LABEL: Record<TaskStatus, string> = {
  upcoming_start: '未开始',
  upcoming_due: '即将截止',
  in_progress: '进行中',
  completed: '已完成',
};

/** 状态颜色 class (tailwind) */
export const STATUS_COLOR: Record<TaskStatus, string> = {
  upcoming_start: 'text-slate-400 bg-slate-400/10',
  upcoming_due: 'text-amber-400 bg-amber-400/10',
  in_progress: 'text-violet-400 bg-violet-400/10',
  completed: 'text-emerald-400 bg-emerald-400/10',
};

/** Flag 对应的人类可读描述 */
export const FLAG_LABEL: Record<TaskFlag, string> = {
  DATE_AMBIGUOUS: '日期歧义',
  MISSING_TIME_DEFAULTED: '时间已补全',
  FUZZY_TIME_DEFAULTED: '模糊时间已补全',
  MISSING_DUE: '缺少截止时间',
  LOW_CONFIDENCE: '低置信度',
};

/** Flag 颜色 */
export const FLAG_COLOR: Record<TaskFlag, string> = {
  DATE_AMBIGUOUS: 'text-red-400 bg-red-400/10',
  MISSING_TIME_DEFAULTED: 'text-yellow-400 bg-yellow-400/10',
  FUZZY_TIME_DEFAULTED: 'text-yellow-400 bg-yellow-400/10',
  MISSING_DUE: 'text-red-400 bg-red-400/10',
  LOW_CONFIDENCE: 'text-orange-400 bg-orange-400/10',
};

/**
 * 只需要向用户展示警告图标的 flag（需要用户处理的）。
 * MISSING_TIME_DEFAULTED / FUZZY_TIME_DEFAULTED 是信息级，不显示 ⚠️。
 */
export const WARN_FLAGS = new Set<TaskFlag>(['MISSING_DUE', 'DATE_AMBIGUOUS', 'LOW_CONFIDENCE']);

export function hasWarnFlag(flags: TaskFlag[]): boolean {
  return flags.some((f) => WARN_FLAGS.has(f));
}

export function warnFlagTip(flags: TaskFlag[]): string {
  return flags
    .filter((f) => WARN_FLAGS.has(f))
    .map((f) => FLAG_LABEL[f])
    .join('、');
}

/** 复杂度文字 */
export function complexityLabel(v: number): string {
  if (v <= 1) return '极低';
  if (v <= 2) return '低';
  if (v <= 3) return '中';
  if (v <= 4) return '高';
  return '极高';
}

/** 检测是否已过期 */
export function isOverdue(due: TaskDue | null | undefined): boolean {
  if (!due) return false;
  return new Date(`${due.date}T${due.time}`) < new Date();
}

/** 为导出文件名生成当前时间戳 */
export function nowStamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', '_').replaceAll(':', '-');
}
