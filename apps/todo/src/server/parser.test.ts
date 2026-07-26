import { describe, expect, it } from 'vitest';
import { parseTextToTasks } from './parser';

describe('localized heuristic task parsing', () => {
  it('creates English fallback steps for an English browser locale', () => {
    const [task] = parseTextToTasks('Final exam 2099-12-20 at 10am', {
      baseTimezone: 'UTC',
      locale: 'en-US',
    });

    expect(task.steps[0].title).toBe('Review the scope and key topics');
  });

  it('creates Chinese fallback steps for a Chinese browser locale', () => {
    const [task] = parseTextToTasks('期末考试 2099-12-20 上午10点', {
      baseTimezone: 'Asia/Shanghai',
      locale: 'zh-CN',
    });

    expect(task.steps[0].title).toBe('整理考点与范围');
  });
});
