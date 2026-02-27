import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  extractJsonText,
  parseAiOutputToTasks,
  normalizeSingleTask,
} from './ai-parser';
import type { ParseCandidateTask } from './types';

type DeepSeekInput = {
  gatewayUrl: string;
  apiKey: string;
  text: string;
  baseTimezone: string;
  locale: string;
};

const DEEPSEEK_MODEL = 'deepseek/deepseek-chat';

async function callGateway(
  gatewayUrl: string,
  apiKey: string,
  userPrompt: string
): Promise<string> {
  const url = `${gatewayUrl.replace(/\/$/, '')}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 2400,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[deepseek] gateway error ${res.status}:`, body.slice(0, 500));
    throw new Error(`DeepSeek gateway error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error('[deepseek] empty content. Full response:', JSON.stringify(data).slice(0, 500));
    throw new Error('DeepSeek returned empty content');
  }

  console.log('[deepseek] raw content:', content.slice(0, 800));
  return content;
}

export async function parseTextToTasksWithDeepSeek(
  input: DeepSeekInput
): Promise<ParseCandidateTask[]> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const todayWeekday = now.toLocaleDateString('en-US', { weekday: 'long' });

  const userPrompt = buildUserPrompt({
    text: input.text,
    baseTimezone: input.baseTimezone,
    locale: input.locale,
    today,
    todayWeekday,
  });

  const content = await callGateway(input.gatewayUrl, input.apiKey, userPrompt);

  const jsonText = extractJsonText(content);
  const parsed = JSON.parse(jsonText) as unknown;
  const rawTasks = parseAiOutputToTasks(parsed);

  if (rawTasks.length === 0) {
    throw new Error('DeepSeek produced no tasks');
  }

  const normalized = rawTasks
    .map((task, index) => normalizeSingleTask(task, input.text, input.baseTimezone, index))
    .filter((task): task is ParseCandidateTask => Boolean(task));

  for (const t of normalized) {
    console.log(`[deepseek] task "${t.title}" | due: ${t.due ? `${t.due.date} ${t.due.time}` : 'null'} | flags: [${t.flags.join(', ')}]`);
  }

  if (normalized.length === 0) {
    throw new Error('DeepSeek produced no valid tasks after normalization');
  }

  return normalized;
}
