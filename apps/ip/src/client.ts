import { localeFromDocument, pick } from '@tools/i18n'

document.addEventListener("DOMContentLoaded", () => {
  const locale = localeFromDocument()
  const messages = pick(locale, {
    en: { copy: 'Copy', copied: 'Copied!', failed: 'Copy failed' },
    zh: { copy: '复制', copied: '已复制！', failed: '复制失败' },
  })
const btn = document.querySelector('[data-copy-ip]');
  const status = document.querySelector('[data-copy-status]');
  if (!btn || !status) return;
  const ip = btn.getAttribute('data-copy-ip') || '';

  const resetText = () => {
    status.textContent = messages.copy;
  };

  let timer: number | null = null;

  const setStatus = (text: string) => {
    status.textContent = text;
    window.clearTimeout(timer);
    timer = window.setTimeout(resetText, 1800);
  };

  btn.addEventListener('click', async () => {
    if (!ip) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(ip);
      } else {
        const input = document.createElement('input');
        input.value = ip;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setStatus(messages.copied);
    } catch (err) {
      console.error(err);
      setStatus(messages.failed);
    }
  });
})
