document.addEventListener("DOMContentLoaded", () => {
const btn = document.querySelector('[data-copy-ip]');
  const status = document.querySelector('[data-copy-status]');
  if (!btn || !status) return;
  const ip = btn.getAttribute('data-copy-ip') || '';

  const resetText = () => {
    status.textContent = 'Copy';
  };

  let timer: number | null = null;

  const setStatus = (text: string) => {
    status.textContent = text;
    clearTimeout(timer);
    timer = setTimeout(resetText, 1800);
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
      setStatus('Copied!');
    } catch (err) {
      console.error(err);
      setStatus('Copy failed');
    }
  });
})