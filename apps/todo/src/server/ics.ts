import { formatUtcToZoned } from './scheduler';
import type { TaskRecord } from './types';

const escapeText = (value: string) => {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatIcsUtc = (date: Date) => {
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`;
};

const formatIcsLocal = (utcIso: string, timeZone: string) => {
  const zoned = formatUtcToZoned(utcIso, timeZone);
  const compactDate = zoned.date.replace(/-/g, '');
  const compactTime = zoned.time.replace(':', '');
  return `${compactDate}T${compactTime}00`;
};

const buildDescription = (task: TaskRecord) => {
  const lines: string[] = [`Complexity: ${task.complexity}/5`, `Estimated: ${task.estimated_hours}h`];

  if (task.start_by_utc && task.start_by_tz) {
    const startByLocal = formatUtcToZoned(task.start_by_utc, task.start_by_tz);
    lines.push(`Start-by: ${startByLocal.date} ${startByLocal.time} (${task.start_by_tz})`);
  }

  lines.push('');
  lines.push('Steps:');

  for (const step of task.steps) {
    lines.push(`- [${step.done ? 'x' : ' '}] ${step.title} (${step.estimated_hours}h)`);
  }

  return escapeText(lines.join('\n'));
};

const buildEvent = ({
  uid,
  summary,
  startUtc,
  timeZone,
  description,
  createdAt,
}: {
  uid: string;
  summary: string;
  startUtc: string;
  timeZone: string;
  description: string;
  createdAt: string;
}) => {
  const start = new Date(startUtc);
  const end = new Date(start.getTime() + 15 * 60 * 1000);

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(new Date(createdAt))}`,
    `DTSTART;TZID=${timeZone}:${formatIcsLocal(startUtc, timeZone)}`,
    `DTEND;TZID=${timeZone}:${formatIcsLocal(end.toISOString(), timeZone)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
  ].join('\r\n');
};

export const buildCalendar = (tasks: TaskRecord[]) => {
  const events: string[] = [];

  for (const task of tasks) {
    if (!task.due_at_utc || !task.due_tz) {
      continue;
    }

    const description = buildDescription(task);

    if (task.start_by_utc && task.start_by_tz) {
      events.push(
        buildEvent({
          uid: `task_${task.id}_start@todo.tools.tf`,
          summary: `Start: ${task.title}`,
          startUtc: task.start_by_utc,
          timeZone: task.start_by_tz,
          description,
          createdAt: task.created_at,
        })
      );
    }

    events.push(
      buildEvent({
        uid: `task_${task.id}_due@todo.tools.tf`,
        summary: `Due: ${task.title}`,
        startUtc: task.due_at_utc,
        timeZone: task.due_tz,
        description,
        createdAt: task.created_at,
      })
    );
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//tools.tf//todo-mvp//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
};
