import { html, raw } from 'hono/html'

export const measurementId = 'G-K8QNWFNXLL'

const productionHosts = [
  'tools.tf',
  'www.tools.tf',
  'datetime.tools.tf',
  'diff.tools.tf',
  'icon.tools.tf',
  'ip.tools.tf',
  'json.tools.tf',
  'password.tools.tf',
  'qr.tools.tf',
]

// Keep this script independent of the app's client framework and bundle.
const bootstrap = `(() => {
  if (location.protocol !== 'https:' ||
      !${JSON.stringify(productionHosts)}.includes(location.hostname) ||
      window.__toolsAnalyticsLoaded) return;
  window.__toolsAnalyticsLoaded = true;

  function cleanUrl(value) {
    try {
      const url = new URL(value);
      return url.origin + url.pathname;
    } catch {
      return '';
    }
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', '${measurementId}', {
    page_location: cleanUrl(location.href),
    page_referrer: cleanUrl(document.referrer),
    cookie_domain: 'tools.tf',
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=${measurementId}';
  script.referrerPolicy = 'strict-origin';
  document.head.appendChild(script);
})();`

export function GoogleAnalytics({ url }: { url: string }) {
  const page = new URL(url)
  if (page.protocol !== 'https:' || !productionHosts.includes(page.hostname)) return null
  return html`<script>${raw(bootstrap)}</script>`
}
