import { clamp, computeStartByFromDue, isValidTimeZone } from './scheduler';
import { makeId } from './store';
import type { ParseCandidateTask, TaskDue, TaskFlag, TaskStep } from './types';

export type WorkersAiBinding = {
  run: (model: string, input: unknown) => Promise<unknown>;
};

type ParseWithAiInput = {
  ai: WorkersAiBinding;
  text: string;
  baseTimezone: string;
  locale: string;
};

const MODEL_CANDIDATES = ['@cf/meta/llama-3.1-8b-instruct-fast', '@cf/meta/llama-3.1-8b-instruct'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const ALLOWED_FLAGS = new Set<TaskFlag>([
  'DATE_AMBIGUOUS',
  'MISSING_TIME_DEFAULTED',
  'FUZZY_TIME_DEFAULTED',
  'MISSING_DUE',
  'LOW_CONFIDENCE',
]);

const COMPLEXITY_BASE_HOURS: Record<number, number> = {
  1: 1.5,
  2: 3,
  3: 4.5,
  4: 6.5,
  5: 9,
};

export const SYSTEM_PROMPT = [
  'You are an extraction engine for a task planning app.',
  'Return JSON only. No markdown, no prose, no explanation.',
  'Schema: {"tasks":[{',
  '  "title": string,',
  '  "context": string,',
  '  "due": {"date":"YYYY-MM-DD", "time":"HH:MM", "timezone":"IANA_TZ", "source_text":string} | null,',
  '  "complexity": 1-5 (integer),',
  '  "estimated_hours": number,',
  '  "steps": [{"id":string, "title":string, "estimated_hours":number}],',
  '  "confidence": 0.0-1.0,',
  '  "flags": string[],',
  '  "start_by": {"date":"YYYY-MM-DD", "time":"HH:MM", "timezone":"IANA_TZ"} | null,',
  '  "start_by_locked": boolean',
  '}]}',
  'CRITICAL: due.date and start_by.date MUST be "YYYY-MM-DD" strings, NEVER ISO 8601 datetime strings.',
  'Rules:',
  '- Extract actionable tasks from mixed Chinese/English text.',
  '- due.time defaults: date-only=>23:59, fuzzy-before=>18:00, morning=>09:00, evening=>20:00.',
  '- complexity is integer 1-5.',
  '- estimated_hours is total hours.',
  '- steps must be 3-5 items with executable verbs and estimated_hours.',
  '- flags only from: DATE_AMBIGUOUS, MISSING_TIME_DEFAULTED, FUZZY_TIME_DEFAULTED, MISSING_DUE, LOW_CONFIDENCE.',
  '- Use DATE_AMBIGUOUS only when truly uncertain which calendar date is meant (e.g. "12/3" could be Dec 3 or Mar 12).',
  '- confidence range: 0 to 1.',
  '- Use timezone in IANA format.',
  '- For relative dates, use the provided Today date AND day-of-week to compute the exact calendar date.',
  '  "下周五" / "next Friday" = the Friday of next week (NOT this week, NOT two weeks away).',
  '  "这周五" / "this Friday" = the coming Friday within the current week.',
  '  Always count from the provided today\'s weekday to resolve these correctly.',
].join('\n');

const round1 = (value: number) => Math.round(value * 10) / 10;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

const getNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const ensureDateString = (value: unknown) => {
  const date = getString(value).trim();
  return DATE_RE.test(date) ? date : '';
};

const ensureTimeString = (value: unknown) => {
  const time = getString(value).trim();
  return TIME_RE.test(time) ? time : '';
};

const mergeFlags = (base: TaskFlag[], incoming: TaskFlag[]) => {
  const set = new Set(base);
  for (const item of incoming) set.add(item);
  return Array.from(set);
};

const parseFlags = (value: unknown) => {
  if (!Array.isArray(value)) return [] as TaskFlag[];
  return value.map((item) => getString(item)).filter((item): item is TaskFlag => ALLOWED_FLAGS.has(item as TaskFlag));
};

const defaultTimeFromText = (text: string): { time: string; flag: TaskFlag } => {
  const lowered = text.toLowerCase();
  if (/上午|早上|morning/.test(lowered)) return { time: '09:00', flag: 'MISSING_TIME_DEFAULTED' };
  if (/晚上|今晚|night|evening/.test(lowered)) return { time: '20:00', flag: 'MISSING_TIME_DEFAULTED' };
  if (/(周[一二三四五六日天].*前|今晚前|before|by\s+\w+|截至|之前|前)/i.test(text)) {
    return { time: '18:00', flag: 'FUZZY_TIME_DEFAULTED' };
  }
  return { time: '23:59', flag: 'MISSING_TIME_DEFAULTED' };
};

const normalizeDue = (
  rawDue: unknown,
  fallbackSource: string,
  baseTimezone: string
): { due: TaskDue | null; flags: TaskFlag[] } => {
  // Coerce ISO 8601 string (e.g. "2026-03-06T23:59:00+08:00") to object format
  if (typeof rawDue === 'string') {
    const m = rawDue.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (m) {
      rawDue = { date: m[1], time: m[2], timezone: baseTimezone, source_text: fallbackSource };
    }
  }

  if (!isObject(rawDue)) {
    return { due: null, flags: ['MISSING_DUE'] };
  }

  const date = ensureDateString(rawDue.date);
  if (!date) {
    return { due: null, flags: ['MISSING_DUE'] };
  }

  const sourceText = getString(rawDue.source_text, fallbackSource).trim() || fallbackSource;
  const zoneRaw = getString(rawDue.timezone, baseTimezone).trim();
  const timezone = isValidTimeZone(zoneRaw) ? zoneRaw : baseTimezone;

  let time = ensureTimeString(rawDue.time);
  const flags: TaskFlag[] = [];

  if (!time) {
    const fallback = defaultTimeFromText(sourceText || fallbackSource);
    time = fallback.time;
    flags.push(fallback.flag);
  }

  return {
    due: {
      date,
      time,
      timezone,
      source_text: sourceText,
    },
    flags,
  };
};

const parseDueLike = (value: unknown, fallbackSource: string, baseTimezone: string): TaskDue | null => {
  // Coerce ISO 8601 string to object format
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (m) {
      value = { date: m[1], time: m[2], timezone: baseTimezone };
    }
  }

  if (!isObject(value)) return null;

  const date = ensureDateString(value.date);
  if (!date) return null;

  const zoneRaw = getString(value.timezone, baseTimezone).trim();
  const timezone = isValidTimeZone(zoneRaw) ? zoneRaw : baseTimezone;
  const sourceText = getString(value.source_text, fallbackSource).trim() || fallbackSource;
  const timeRaw = ensureTimeString(value.time);

  if (!timeRaw) {
    return null;
  }

  return {
    date,
    time: timeRaw,
    timezone,
    source_text: sourceText,
  };
};

const inferKind = (text: string) => {
  const lowered = text.toLowerCase();
  if (/考试|quiz|exam|test|复习/.test(lowered)) return 'exam';
  if (/论文|report|paper|总结|write|文档/.test(lowered)) return 'writing';
  if (/代码|coding|project|实现|debug|开发/.test(lowered)) return 'coding';
  return 'generic';
};

const buildDefaultSteps = (kind: 'exam' | 'writing' | 'coding' | 'generic', estimatedHours: number): TaskStep[] => {
  const titles: Record<typeof kind, string[]> = {
    exam: ['整理考点与范围', '完成重点练习与错题', '查漏补缺并复盘', '考前快速回顾'],
    writing: ['确认题目与资料清单', '搭建结构并写初稿', '修订论证与表达', '最终排版并提交'],
    coding: ['读需求并拆分任务', '实现核心功能', '测试与修复问题', '整理文档并提交'],
    generic: ['明确交付要求', '完成主体内容', '自查与修正', '提交并记录结果'],
  };

  const weights = [0.15, 0.45, 0.25, 0.15];
  const base = titles[kind];
  const steps = base.map((title, index) => ({
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

const normalizeComplexity = (value: unknown) => clamp(Math.round(getNumber(value, 3)), 1, 5);

const normalizeEstimatedHours = (value: unknown, complexity: number, stepHoursHint: number) => {
  const fromInput = getNumber(value, Number.NaN);
  if (Number.isFinite(fromInput) && fromInput > 0) {
    return round1(clamp(fromInput, 0.5, 24));
  }
  if (stepHoursHint > 0) {
    return round1(clamp(stepHoursHint, 0.5, 24));
  }
  return COMPLEXITY_BASE_HOURS[complexity] ?? 4.5;
};

const normalizeSteps = (value: unknown, estimatedHours: number, taskHint: string): TaskStep[] => {
  const fallback = buildDefaultSteps(inferKind(taskHint), estimatedHours);
  if (!Array.isArray(value)) return fallback;

  const cleaned = value
    .filter((item) => isObject(item))
    .map((item, index) => {
      const title = getString(item.title).trim() || `步骤 ${index + 1}`;
      const hours = round1(Math.max(0.3, getNumber(item.estimated_hours, 0.3)));
      return {
        id: getString(item.id).trim() || `step_${index + 1}`,
        title,
        estimated_hours: hours,
        done: Boolean(item.done),
      };
    });

  if (cleaned.length === 0) return fallback;

  const steps = cleaned.slice(0, 5);

  if (steps.length < 3) {
    const supplement = fallback.slice(steps.length, 3);
    steps.push(...supplement);
  }

  const total = steps.reduce((sum, step) => sum + step.estimated_hours, 0);
  const delta = round1(estimatedHours - total);
  steps[steps.length - 1].estimated_hours = round1(Math.max(0.3, steps[steps.length - 1].estimated_hours + delta));

  return steps;
};

const normalizeConfidence = (value: unknown, hasDue: boolean) => {
  const fallback = hasDue ? 0.76 : 0.45;
  return clamp(getNumber(value, fallback), 0.1, 0.99);
};

const normalizeAmbiguity = (value: unknown): ParseCandidateTask['ambiguity_options'] | undefined => {
  if (!isObject(value)) return undefined;
  const first = ensureDateString(value.first);
  const second = ensureDateString(value.second);
  const selected = ensureDateString(value.selected);
  if (!first || !second || !selected) return undefined;
  return { first, second, selected };
};

const extractResponseText = (value: unknown): string => {
  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = extractResponseText(item);
      if (text) return text;
    }
    return '';
  }

  if (!isObject(value)) return '';

  const direct = [value.response, value.output_text, value.text];
  for (const item of direct) {
    if (typeof item === 'string' && item.trim().length > 0) return item;
  }

  for (const item of Object.values(value)) {
    const text = extractResponseText(item);
    if (text) return text;
  }

  return '';
};

const stripMarkdownFence = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```[a-zA-Z]*\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
};

export const extractJsonText = (value: string) => {
  const stripped = stripMarkdownFence(value);
  const objectStart = stripped.indexOf('{');
  const arrayStart = stripped.indexOf('[');

  if (objectStart === -1 && arrayStart === -1) return stripped;

  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  const start = Math.min(...starts);
  const opening = stripped[start];
  const closing = opening === '{' ? '}' : ']';
  const end = stripped.lastIndexOf(closing);

  if (end <= start) return stripped;
  return stripped.slice(start, end + 1);
};

export const parseAiOutputToTasks = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (!isObject(value)) return [];
  if (Array.isArray(value.tasks)) return value.tasks;
  return [];
};

export const normalizeSingleTask = (
  raw: unknown,
  sourceText: string,
  baseTimezone: string,
  index: number
): ParseCandidateTask | null => {
  if (!isObject(raw)) return null;

  const title = getString(raw.title).trim() || `任务 ${index + 1}`;
  const context = getString(raw.context).trim();
  let flags = parseFlags(raw.flags);

  const dueResult = normalizeDue(raw.due, sourceText, baseTimezone);
  flags = mergeFlags(flags, dueResult.flags);

  const complexity = normalizeComplexity(raw.complexity);
  const stepHourHint = Array.isArray(raw.steps)
    ? raw.steps
        .filter((item) => isObject(item))
        .reduce((sum, item) => sum + Math.max(0, getNumber(item.estimated_hours, 0)), 0)
    : 0;
  const estimatedHours = normalizeEstimatedHours(raw.estimated_hours, complexity, stepHourHint);
  const steps = normalizeSteps(raw.steps, estimatedHours, `${title} ${context}`);
  const confidence = normalizeConfidence(raw.confidence, Boolean(dueResult.due));

  if (confidence < 0.5 && !flags.includes('LOW_CONFIDENCE')) {
    flags.push('LOW_CONFIDENCE');
  }

  const startByLocked = Boolean(raw.start_by_locked);
  const parsedStartBy = parseDueLike(raw.start_by, title, dueResult.due?.timezone ?? baseTimezone);

  let startBy: TaskDue | null = null;
  if (dueResult.due) {
    startBy =
      startByLocked && parsedStartBy ? parsedStartBy : computeStartByFromDue(dueResult.due, complexity, estimatedHours);
  } else if (startByLocked && parsedStartBy) {
    startBy = parsedStartBy;
  }

  return {
    id: makeId('candidate'),
    title,
    context,
    due: dueResult.due,
    complexity,
    estimated_hours: estimatedHours,
    steps,
    confidence: round1(confidence),
    flags,
    start_by: startBy,
    start_by_locked: startByLocked,
    ambiguity_options: normalizeAmbiguity(raw.ambiguity_options),
  };
};

const parseModelJson = (rawResponse: unknown): unknown => {
  const responseText = extractResponseText(rawResponse).trim();
  if (!responseText) {
    throw new Error('Workers AI returned empty response text');
  }

  const jsonText = extractJsonText(responseText);
  return JSON.parse(jsonText) as unknown;
};

export const buildUserPrompt = (input: { text: string; baseTimezone: string; locale: string; today: string; todayWeekday: string }) => {
  return [
    `Base timezone: ${input.baseTimezone}`,
    `Locale: ${input.locale}`,
    `Today: ${input.today} (${input.todayWeekday})`,
    'Relative date rules (apply strictly using today\'s weekday above):',
    '  下周X / next [weekday] = the X of next week (7-13 days from today depending on weekday)',
    '  这周X / this [weekday] = the X within the current calendar week',
    '  上周X / last [weekday] = the X of last week',
    '  今晚 / tonight = today at 20:00',
    '  解析时必须输出具体日期 YYYY-MM-DD，不得含糊。',
    'Extract tasks from this text and output strict JSON using the requested schema.',
    'If a sentence is likely not a task, skip it unless uncertainty is high; then keep it with LOW_CONFIDENCE.',
    'Text:',
    input.text,
  ].join('\n');
};

const runWorkersAi = async (ai: WorkersAiBinding, model: string, prompt: string) => {
  const response = await ai.run(model, {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 2200,
  });

  return response;
};

export const parseTextToTasksWithAi = async (input: ParseWithAiInput): Promise<ParseCandidateTask[]> => {
  const now = new Date();
  const prompt = buildUserPrompt({
    text: input.text,
    baseTimezone: input.baseTimezone,
    locale: input.locale,
    today: now.toISOString().slice(0, 10),
    todayWeekday: now.toLocaleDateString('en-US', { weekday: 'long' }),
  });

  let lastError: Error | null = null;

  for (const model of MODEL_CANDIDATES) {
    try {
      const rawResponse = await runWorkersAi(input.ai, model, prompt);
      const json = parseModelJson(rawResponse);
      const rawTasks = parseAiOutputToTasks(json);
      if (rawTasks.length === 0) {
        throw new Error(`Workers AI model ${model} produced no tasks`);
      }

      const normalized = rawTasks
        .map((task, index) => normalizeSingleTask(task, input.text, input.baseTimezone, index))
        .filter((task): task is ParseCandidateTask => Boolean(task));

      if (normalized.length === 0) {
        throw new Error(`Workers AI model ${model} produced no valid tasks`);
      }

      return normalized;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Workers AI parsing failed');
    }
  }

  throw lastError ?? new Error('Workers AI parsing failed');
};
