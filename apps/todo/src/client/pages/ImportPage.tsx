/** @jsxImportSource react */
import { useState } from 'react';
import type { ParseResponse } from '../types';
import { parseText } from '../api';

type Props = {
  onParsed: (result: ParseResponse) => void;
  onGoToTasks: () => void;
};

const EXAMPLE_TEXT = `高数期末考试 12/20 上午10点，需要复习极限、导数、积分。
英语作文 下周五前，写一篇关于AI伦理的800字文章。
项目答辩 1月8日，准备PPT和演讲稿，时间大概3小时。
今晚刷完算法题10道。`;

export function ImportPage({ onParsed, onGoToTasks }: Props) {
  const [text, setText] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [locale, setLocale] = useState('zh-CN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!text.trim()) {
      setError('请输入任务文本');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await parseText({ text, base_timezone: timezone, locale });
      onParsed(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
          TF
        </div>
        <span className="font-semibold text-lg tracking-tight">TaskFlow AI</span>
        <nav className="ml-6 flex items-center gap-1 text-sm">
          <span className="text-gray-200 px-2 py-1">导入</span>
          <span className="text-gray-700">/</span>
          <button
            type="button"
            onClick={onGoToTasks}
            className="text-gray-500 hover:text-gray-200 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            任务库
          </button>
        </nav>
        <span className="ml-auto text-xs text-gray-500">v0.1 MVP</span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-3xl mx-auto w-full">
        <div className="mb-3 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
          AI 驱动
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          粘贴任何文本，<br />自动拆解为可执行任务
        </h1>
        <p className="text-gray-400 text-center mb-10 max-w-xl">
          支持 syllabus、群消息、备忘录等多种格式，自动识别截止时间、计算最晚开始时间，并支持导出日历提醒。
        </p>

        {/* Input card */}
        <div className="w-full bg-gray-900 border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-2 text-xs text-gray-500 font-mono">任务文本</span>
            <button
              type="button"
              onClick={() => setText(EXAMPLE_TEXT)}
              className="ml-auto text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
            >
              填入示例
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="粘贴你的 syllabus、群聊截图文字、待办事项……&#10;&#10;例：高数期末考试 12/20 上午10点，需要复习极限、导数和积分。"
            rows={8}
            className="w-full bg-transparent px-5 py-4 text-sm text-gray-200 placeholder-gray-600 resize-none outline-none font-mono leading-relaxed"
          />

          <div className="px-4 py-3 border-t border-white/5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">时区</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="text-xs bg-gray-800 border border-white/8 rounded-lg px-2 py-1.5 text-gray-300 w-40 outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">语言</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="text-xs bg-gray-800 border border-white/8 rounded-lg px-2 py-1.5 text-gray-300 outline-none focus:border-violet-500/50 transition-colors cursor-pointer"
              >
                <option value="zh-CN">中文</option>
                <option value="en-US">English</option>
              </select>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {error && <span className="text-xs text-red-400">{error}</span>}
              <button
                type="button"
                onClick={handleParse}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed
                  text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Spinner />
                    解析中…
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    开始解析
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {[
            { icon: '🧠', title: 'AI 智能解析', desc: '自动识别任务、截止时间、复杂度' },
            { icon: '📅', title: 'Start-by 计算', desc: '基于复杂度推算最晚启动时间' },
            { icon: '📆', title: 'ICS 日历导出', desc: '一键导入 Apple Calendar / Google Calendar' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900/50 border border-white/5 rounded-xl p-4 text-center hover:border-white/10 transition-colors">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-medium text-gray-200 mb-1">{f.title}</div>
              <div className="text-xs text-gray-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
