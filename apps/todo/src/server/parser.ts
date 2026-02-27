import { clamp, computeSmartStartBy, computeStartByFromDue, formatUtcToZoned, isValidTimeZone, zonedDateTimeToUtc } from './scheduler';
import { makeId } from './store';
import type { ParseCandidateTask, TaskDue, TaskFlag, TaskStep } from './types';

const DAY_MS = 86_400_000;

const WEEKDAY_MAP: Record<string, number> = {
  日: 0,
  天: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
};

const TASK_KEYWORDS = [
  '作业',
  '大作业',
  '提交',
  'ddl',
  'deadline',
  '考试',
  '复习',
  '报告',
  '论文',
  '项目',
  'presentation',
  'assignment',
  'report',
  'paper',
  'quiz',
  'exam',
  'review',
  'prepare',
  'finish',
  'complete',
];

const HARD_KEYWORDS = ['final', 'project', 'thesis', '论文', '大作业', '考试', '系统设计', '复杂', '很难', 'hard'];
const LIGHT_KEYWORDS = ['阅读', 'read', 'quiz', '签到', '简单', 'easy', 'summary'];
const WRITING_KEYWORDS = ['论文', 'report', 'paper', '总结', '文档', 'write'];
const CODING_KEYWORDS = ['代码', 'coding', 'project', '实现', 'debug', '开发'];
const EXAM_KEYWORDS = ['考试', 'quiz', 'exam', '复习', 'test'];

type ParseOptions = {
  baseTimezone: string;
  locale: string;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

const getNowInTimezoneParts = (timeZone: string, now: Date) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  const weekdayRaw = values.weekday.toLowerCase();
  const weekday = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(weekdayRaw.slice(0, 3));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday,
  };
};

const toDateString = (year: number, month: number, day: number) => {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const extractContext = (line: string) => {
  const match = line.match(/\b([A-Z]{2,5}\d{2,4})\b/);
  if (match) return match[1];

  const cnMatch = line.match(/课程[:：]\s*([^\s，,]+)/);
  if (cnMatch) return cnMatch[1];

  return '';
};

const inferTaskKind = (line: string) => {
  const lowered = line.toLowerCase();
  if (EXAM_KEYWORDS.some((keyword) => lowered.includes(keyword))) return 'exam';
  if (WRITING_KEYWORDS.some((keyword) => lowered.includes(keyword))) return 'writing';
  if (CODING_KEYWORDS.some((keyword) => lowered.includes(keyword))) return 'coding';
  return 'generic';
};

const estimateComplexity = (line: string) => {
  const lowered = line.toLowerCase();
  let score = 3;

  if (HARD_KEYWORDS.some((keyword) => lowered.includes(keyword))) score += 1;
  if (lowered.includes('presentation') || lowered.includes('展示') || lowered.includes('答辩')) score += 1;
  if (LIGHT_KEYWORDS.some((keyword) => lowered.includes(keyword))) score -= 1;
  if (lowered.includes('very hard') || lowered.includes('特别难')) score += 1;

  return clamp(score, 1, 5);
};

const estimateHoursByComplexity = (complexity: number, line: string) => {
  const baseMap: Record<number, number> = {
    1: 1.5,
    2: 3,
    3: 4.5,
    4: 6.5,
    5: 9,
  };

  const lowered = line.toLowerCase();
  let hours = baseMap[complexity] ?? 4.5;

  if (WRITING_KEYWORDS.some((keyword) => lowered.includes(keyword))) hours += 1;
  if (lowered.includes('group') || lowered.includes('小组')) hours += 0.5;
  if (lowered.includes('draft') || lowered.includes('初稿')) hours -= 0.5;

  return round1(clamp(hours, 1, 16));
};

const normalizeTitle = (line: string) => {
  let title = line
    .replace(/\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, ' ')
    .replace(/\b\d{1,2}[/.]\d{1,2}\b/g, ' ')
    .replace(/\d{1,2}月\d{1,2}日/g, ' ')
    .replace(/下周[一二三四五六日天]/g, ' ')
    .replace(/周[一二三四五六日天]/g, ' ')
    .replace(/\d{1,2}[:：]\d{2}/g, ' ')
    .replace(/\d{1,2}点半?/g, ' ')
    .replace(/(上午|下午|晚上|今晚|早上|中午|前|before|due|ddl|deadline)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  title = title.replace(/^[-•*\d.)\s]+/, '').trim();
  return title || line.slice(0, 42);
};

const lineLooksTaskLike = (line: string) => {
  const lowered = line.toLowerCase();
  return TASK_KEYWORDS.some((keyword) => lowered.includes(keyword));
};

const parseTime = (line: string) => {
  const flags: TaskFlag[] = [];
  const lowered = line.toLowerCase();

  const hmMatch = line.match(/(\d{1,2})[:：](\d{2})/);
  if (hmMatch) {
    let hour = Number(hmMatch[1]);
    const minute = Number(hmMatch[2]);
    if (/下午|晚上|pm/.test(lowered) && hour < 12) hour += 12;
    if (/凌晨/.test(lowered) && hour === 12) hour = 0;
    return { time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, flags };
  }

  const halfMatch = line.match(/(\d{1,2})点半/);
  if (halfMatch) {
    let hour = Number(halfMatch[1]);
    if (/下午|晚上|pm/.test(lowered) && hour < 12) hour += 12;
    return { time: `${String(hour).padStart(2, '0')}:30`, flags };
  }

  const hourMatch = line.match(/(\d{1,2})点/);
  if (hourMatch) {
    let hour = Number(hourMatch[1]);
    if (/下午|晚上|pm/.test(lowered) && hour < 12) hour += 12;
    if (/上午|早上|am/.test(lowered) && hour === 12) hour = 0;
    return { time: `${String(hour).padStart(2, '0')}:00`, flags };
  }

  const fuzzyBefore = /前|before|by\s+friday|今晚前|周[一二三四五六日天]前/i.test(line);

  if (/上午|早上|morning/.test(lowered)) {
    flags.push('MISSING_TIME_DEFAULTED');
    return { time: '09:00', flags };
  }

  if (/晚上|今晚|night|evening/.test(lowered)) {
    flags.push('MISSING_TIME_DEFAULTED');
    return { time: '20:00', flags };
  }

  if (fuzzyBefore) {
    flags.push('FUZZY_TIME_DEFAULTED');
    return { time: '18:00', flags };
  }

  flags.push('MISSING_TIME_DEFAULTED');
  return { time: '23:59', flags };
};

const chooseNearestFuture = (a: Date, b: Date, now: Date) => {
  const aDiff = a.getTime() - now.getTime();
  const bDiff = b.getTime() - now.getTime();

  const aScore = aDiff >= 0 ? aDiff : Number.POSITIVE_INFINITY;
  const bScore = bDiff >= 0 ? bDiff : Number.POSITIVE_INFINITY;

  if (aScore === Number.POSITIVE_INFINITY && bScore === Number.POSITIVE_INFINITY) {
    return aDiff > bDiff ? a : b;
  }

  return aScore <= bScore ? a : b;
};

const adjustToFutureYear = (year: number, month: number, day: number, now: Date) => {
  let candidate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  if (candidate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    candidate = new Date(Date.UTC(year + 1, month - 1, day, 0, 0, 0));
  }
  return candidate;
};

const parseDate = (
  line: string,
  baseTimezone: string,
  now: Date
): { date: string | null; flags: TaskFlag[]; ambiguity?: ParseCandidateTask['ambiguity_options'] } => {
  const flags: TaskFlag[] = [];

  const ymdMatch = line.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    return { date: toDateString(year, month, day), flags };
  }

  const mdCnMatch = line.match(/(\d{1,2})月(\d{1,2})日/);
  if (mdCnMatch) {
    const month = Number(mdCnMatch[1]);
    const day = Number(mdCnMatch[2]);
    const current = getNowInTimezoneParts(baseTimezone, now);
    const candidate = adjustToFutureYear(current.year, month, day, now);
    return {
      date: toDateString(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate()),
      flags,
    };
  }

  const mdMatch = line.match(/\b(\d{1,2})[/.](\d{1,2})\b/);
  if (mdMatch) {
    const left = Number(mdMatch[1]);
    const right = Number(mdMatch[2]);
    const current = getNowInTimezoneParts(baseTimezone, now);

    if (left <= 12 && right <= 12) {
      flags.push('DATE_AMBIGUOUS');
      const first = adjustToFutureYear(current.year, left, right, now);
      const second = adjustToFutureYear(current.year, right, left, now);
      const selected = chooseNearestFuture(first, second, now);
      return {
        date: toDateString(selected.getUTCFullYear(), selected.getUTCMonth() + 1, selected.getUTCDate()),
        flags,
        ambiguity: {
          first: toDateString(first.getUTCFullYear(), first.getUTCMonth() + 1, first.getUTCDate()),
          second: toDateString(second.getUTCFullYear(), second.getUTCMonth() + 1, second.getUTCDate()),
          selected: toDateString(selected.getUTCFullYear(), selected.getUTCMonth() + 1, selected.getUTCDate()),
        },
      };
    }

    const month = left > 12 ? right : left;
    const day = left > 12 ? left : right;
    const candidate = adjustToFutureYear(current.year, month, day, now);
    return {
      date: toDateString(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate()),
      flags,
    };
  }

  const nextDayMatch = line.match(/(下周|周)([一二三四五六日天])/);
  if (nextDayMatch) {
    const isNextWeek = nextDayMatch[1] === '下周';
    const dayToken = nextDayMatch[2];
    const targetWeekday = WEEKDAY_MAP[dayToken];
    const nowParts = getNowInTimezoneParts(baseTimezone, now);
    const baseDate = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day, 0, 0, 0));

    let diff = (targetWeekday - nowParts.weekday + 7) % 7;
    if (diff === 0) diff = 7;
    if (isNextWeek) diff += 7;

    const candidate = new Date(baseDate.getTime() + diff * DAY_MS);
    return {
      date: toDateString(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate()),
      flags,
    };
  }

  if (/明天/.test(line)) {
    const nowParts = getNowInTimezoneParts(baseTimezone, now);
    const baseDate = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day, 0, 0, 0));
    const candidate = new Date(baseDate.getTime() + DAY_MS);
    return {
      date: toDateString(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate()),
      flags,
    };
  }

  if (/后天/.test(line)) {
    const nowParts = getNowInTimezoneParts(baseTimezone, now);
    const baseDate = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day, 0, 0, 0));
    const candidate = new Date(baseDate.getTime() + 2 * DAY_MS);
    return {
      date: toDateString(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate()),
      flags,
    };
  }

  return { date: null, flags: ['MISSING_DUE'] };
};

const buildSteps = (kind: 'exam' | 'writing' | 'coding' | 'generic', estimatedHours: number): TaskStep[] => {
  const templates: Record<typeof kind, string[]> = {
    exam: ['整理考点与范围', '完成重点练习与错题', '查漏补缺并复盘', '考前快速回顾'],
    writing: ['确认题目与资料清单', '搭建结构并写初稿', '修订论证与表达', '最终排版并提交'],
    coding: ['读需求并拆分任务', '实现核心功能', '测试与修复问题', '整理文档并提交'],
    generic: ['明确交付要求', '完成主体内容', '自查与修正', '提交并记录结果'],
  };

  const titles = templates[kind];
  const weights = [0.15, 0.45, 0.25, 0.15];
  const steps = titles.map((title, index) => ({
    id: `step_${index + 1}`,
    title,
    estimated_hours: round1(Math.max(0.3, estimatedHours * weights[index])),
    done: false,
  }));

  const total = steps.reduce((sum, step) => sum + step.estimated_hours, 0);
  const delta = round1(estimatedHours - total);
  steps[steps.length - 1].estimated_hours = round1(Math.max(0.3, steps[steps.length - 1].estimated_hours + delta));

  return steps;
};

const buildConfidence = (line: string, hasDue: boolean) => {
  let confidence = 0.52;
  if (lineLooksTaskLike(line)) confidence += 0.2;
  if (hasDue) confidence += 0.15;
  if (/\?|哈哈|😂|thanks|谢谢/.test(line)) confidence -= 0.2;
  return Number(clamp(round1(confidence), 0.1, 0.99));
};

const splitCandidates = (text: string) => {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/[;；]+/))
    .map((line) => line.trim())
    .filter((line) => line.length >= 3);
};

export const parseTextToTasks = (text: string, options: ParseOptions): ParseCandidateTask[] => {
  const baseTimezone = isValidTimeZone(options.baseTimezone)
    ? options.baseTimezone
    : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();

  const candidates = splitCandidates(text);

  const tasks: ParseCandidateTask[] = [];

  for (const line of candidates) {
    const dueDateResult = parseDate(line, baseTimezone, now);
    const hasDate = Boolean(dueDateResult.date);
    const keywordHit = lineLooksTaskLike(line);

    if (!keywordHit && !hasDate) {
      continue;
    }

    const timeResult = parseTime(line);
    const flags = [...dueDateResult.flags];

    for (const timeFlag of timeResult.flags) {
      if (!flags.includes(timeFlag)) {
        flags.push(timeFlag);
      }
    }

    const complexity = estimateComplexity(line);
    const estimatedHours = estimateHoursByComplexity(complexity, line);
    const kind = inferTaskKind(line);
    const steps = buildSteps(kind, estimatedHours);
    const confidence = buildConfidence(line, hasDate);

    if (confidence < 0.5 && !flags.includes('LOW_CONFIDENCE')) {
      flags.push('LOW_CONFIDENCE');
    }

    const due: TaskDue | null = dueDateResult.date
      ? {
          date: dueDateResult.date,
          time: timeResult.time,
          timezone: baseTimezone,
          source_text: line,
        }
      : null;

    let startBy: TaskDue | null = null;
    if (due) {
      startBy = computeStartByFromDue(due, complexity, estimatedHours);
    }

    tasks.push({
      id: makeId('candidate'),
      title: normalizeTitle(line),
      context: extractContext(line),
      due,
      complexity,
      estimated_hours: estimatedHours,
      steps,
      confidence,
      flags,
      start_by: startBy,
      start_by_locked: false,
      ambiguity_options: dueDateResult.ambiguity,
    });
  }

  if (tasks.length === 0) {
    const fallbackTitle = text.trim().slice(0, 60) || '未命名任务';
    const complexity = 3;
    const estimatedHours = 4;
    const steps = buildSteps('generic', estimatedHours);
    tasks.push({
      id: makeId('candidate'),
      title: normalizeTitle(fallbackTitle),
      context: '',
      due: null,
      complexity,
      estimated_hours: estimatedHours,
      steps,
      confidence: 0.35,
      flags: ['MISSING_DUE', 'LOW_CONFIDENCE'],
      start_by: null,
      start_by_locked: false,
    });
  }

  return tasks;
};

const normalizeSteps = (steps: TaskStep[], estimatedHours: number) => {
  if (steps.length < 3 || steps.length > 5) {
    throw new Error('steps 必须在 3 到 5 条之间');
  }

  const cleaned = steps.map((step, index) => ({
    id: step.id || `step_${index + 1}`,
    title: step.title.trim() || `步骤 ${index + 1}`,
    estimated_hours: round1(Math.max(0.3, Number(step.estimated_hours || 0.3))),
    done: Boolean(step.done),
  }));

  const total = cleaned.reduce((sum, step) => sum + step.estimated_hours, 0);
  const delta = round1(estimatedHours - total);
  cleaned[cleaned.length - 1].estimated_hours = round1(
    Math.max(0.3, cleaned[cleaned.length - 1].estimated_hours + delta)
  );

  return cleaned;
};

export const normalizeCandidateForCreate = (
  candidate: ParseCandidateTask,
  existingTasks: { start_by_utc: string | null; start_by_tz: string | null; estimated_hours: number }[] = []
) => {
  const complexity = clamp(Math.round(candidate.complexity), 1, 5);
  const estimatedHours = round1(Math.max(0.5, Number(candidate.estimated_hours || 0.5)));
  const steps = normalizeSteps(candidate.steps, estimatedHours);

  const due = candidate.due;
  const dueUtc = due ? zonedDateTimeToUtc(due.date, due.time, due.timezone).toISOString() : null;

  let startBy = candidate.start_by;
  if (due && (!startBy || !candidate.start_by_locked)) {
    if (existingTasks.length > 0) {
      startBy = computeSmartStartBy(due, complexity, estimatedHours, existingTasks);
    } else {
      startBy = computeStartByFromDue(due, complexity, estimatedHours);
    }
  }

  const startByUtc = startBy ? zonedDateTimeToUtc(startBy.date, startBy.time, startBy.timezone).toISOString() : null;

  return {
    complexity,
    estimatedHours,
    steps,
    due,
    dueUtc,
    startBy,
    startByUtc,
  };
};

export const deriveDueFromUtc = (due_at_utc: string | null, due_tz: string | null) => {
  if (!due_at_utc || !due_tz) return null;
  return formatUtcToZoned(due_at_utc, due_tz);
};
