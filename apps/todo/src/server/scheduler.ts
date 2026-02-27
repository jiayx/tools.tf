import type { TaskDue, TaskStatus } from './types';

const MINUTES = 60_000;
const DAY_MS = 86_400_000;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseDateTime = (date: string, time: string) => {
  const [year, month, day] = date.split('-').map((part) => Number(part));
  const [hour, minute] = time.split(':').map((part) => Number(part));
  return { year, month, day, hour, minute };
};

export const isValidTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

export const getOffsetMinutes = (timeZone: string, date: Date) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const values: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = Number(part.value);
    }
  }

  const zoneAsUtc = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second);

  return Math.round((zoneAsUtc - date.getTime()) / MINUTES);
};

export const zonedDateTimeToUtc = (date: string, time: string, timeZone: string) => {
  const { year, month, day, hour, minute } = parseDateTime(date, time);
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstOffset = getOffsetMinutes(timeZone, new Date(guessUtcMs));
  const firstPass = guessUtcMs - firstOffset * MINUTES;
  const secondOffset = getOffsetMinutes(timeZone, new Date(firstPass));
  const actualUtcMs = guessUtcMs - secondOffset * MINUTES;
  return new Date(actualUtcMs);
};

export const formatUtcToZoned = (utcIso: string, timeZone: string): TaskDue => {
  const date = new Date(utcIso);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
    timezone: timeZone,
    source_text: 'derived',
  };
};

const minLeadDaysByComplexity = (complexity: number) => {
  if (complexity <= 2) return 1;
  if (complexity === 3) return 3;
  return 5;
};

export const computeLeadDays = (complexity: number, estimatedHours: number) => {
  const daysByHours = Math.ceil(Math.max(estimatedHours, 0.5) / 2);
  const minDays = minLeadDaysByComplexity(complexity);
  return Math.max(daysByHours, minDays);
};

export const computeStartByFromDue = (due: TaskDue, complexity: number, estimatedHours: number): TaskDue => {
  const dueUtc = zonedDateTimeToUtc(due.date, due.time, due.timezone);
  const leadDays = computeLeadDays(complexity, estimatedHours);

  let startUtcMs = dueUtc.getTime() - leadDays * DAY_MS;
  const nowMs = Date.now();

  if (dueUtc.getTime() > nowMs && startUtcMs < nowMs) {
    startUtcMs = nowMs;
  }

  const startUtc = new Date(startUtcMs);
  const startZoned = formatUtcToZoned(startUtc.toISOString(), due.timezone);

  return {
    ...startZoned,
    source_text: `auto_from_due_minus_${leadDays}_days`,
  };
};

export const MAX_HOURS_PER_DAY = 6;

export const computeSmartStartBy = (
  due: TaskDue,
  complexity: number,
  estimatedHours: number,
  existingTasks: { start_by_utc: string | null; start_by_tz: string | null; estimated_hours: number }[]
): TaskDue => {
  let candidateStart = computeStartByFromDue(due, complexity, estimatedHours);
  const todayZoned = formatUtcToZoned(new Date().toISOString(), candidateStart.timezone);

  for (let offsetDays = 0; offsetDays < 30; offsetDays++) {
    const candidateDateStr = candidateStart.date;

    let currentLoad = 0;
    for (const t of existingTasks) {
      if (t.start_by_utc) {
        const tZoned = formatUtcToZoned(t.start_by_utc, candidateStart.timezone);
        if (tZoned.date === candidateDateStr) {
          currentLoad += t.estimated_hours;
        }
      }
    }

    if (currentLoad + estimatedHours <= MAX_HOURS_PER_DAY) {
      if (offsetDays > 0) {
        candidateStart.source_text += `_pushed_${offsetDays}_days_due_to_load`;
      }
      return candidateStart;
    }

    const currentUtc = zonedDateTimeToUtc(candidateStart.date, candidateStart.time, candidateStart.timezone);
    const prevDayUtc = new Date(currentUtc.getTime() - DAY_MS);
    const nextCandidate = formatUtcToZoned(prevDayUtc.toISOString(), candidateStart.timezone);

    // Cannot time travel: if pushing back causes the date to be before today, we accept the overload.
    if (nextCandidate.date < todayZoned.date) {
      if (offsetDays > 0) {
        candidateStart.source_text += `_clamped_to_today_forced_overload`;
      }
      return candidateStart;
    }

    candidateStart = nextCandidate;
  }

  return candidateStart;
};

export const getTaskStatus = (
  task: {
    completed: boolean;
    due_at_utc: string | null;
    start_by_utc: string | null;
    manual_status?: TaskStatus | null;
  },
  now = new Date()
): TaskStatus => {
  if (task.completed) return 'completed';
  if (task.manual_status && task.manual_status !== 'completed') {
    return task.manual_status;
  }

  const nowMs = now.getTime();

  // Deadline urgency takes highest priority regardless of start
  if (task.due_at_utc) {
    const dueMs = new Date(task.due_at_utc).getTime();
    if (dueMs <= nowMs + 48 * 60 * 60 * 1000) {
      return 'upcoming_due';
    }
  }

  // start_by in the future → not yet started; in the past → in progress
  if (task.start_by_utc) {
    const startMs = new Date(task.start_by_utc).getTime();
    return startMs > nowMs ? 'upcoming_start' : 'in_progress';
  }

  // No start_by and no urgent due → unscheduled, treat as not started
  return 'upcoming_start';
};
