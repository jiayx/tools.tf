import { localeFromDocument, pick } from '@tools/i18n'

type IpFamily = 'ipv4' | 'ipv6'

type ProbeResponse = {
  ip: string
  family: IpFamily | 'unknown'
}

const PROBES: Record<IpFamily, string> = {
  ipv4: 'https://v4.ip.tools.tf/probe',
  ipv6: 'https://v6.ip.tools.tf/probe',
}

document.addEventListener('DOMContentLoaded', () => {
  const locale = localeFromDocument()
  const messages = pick(locale, {
    en: {
      checking: 'Checking connectivity…',
      connected: 'Connected',
      unavailable: 'Unavailable on this network',
      copy: 'Copy',
      copied: 'Copied!',
      failed: 'Copy failed',
    },
    zh: {
      checking: '正在检测连接…',
      connected: '连接正常',
      unavailable: '当前网络不可用',
      copy: '复制',
      copied: '已复制！',
      failed: '复制失败',
    },
  })

  const copyText = async (value: string) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(value)
      return
    }

    const input = document.createElement('input')
    input.value = value
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    input.remove()
  }

  const primaryButton = document.querySelector<HTMLButtonElement>('[data-copy-ip]')
  const primaryStatus = document.querySelector<HTMLElement>('[data-copy-status]')
  if (primaryButton && primaryStatus) {
    let timer: number | undefined
    primaryButton.addEventListener('click', async () => {
      const ip = primaryButton.dataset.copyIp
      if (!ip) return

      try {
        await copyText(ip)
        primaryStatus.textContent = messages.copied
      } catch (error) {
        console.error(error)
        primaryStatus.textContent = messages.failed
      }

      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        primaryStatus.textContent = messages.copy
      }, 1_800)
    })
  }

  const probe = async (expectedFamily: IpFamily) => {
    const value = document.querySelector<HTMLElement>(`[data-ip-family="${expectedFamily}"]`)
    const status = document.querySelector<HTMLElement>(`[data-ip-status="${expectedFamily}"]`)
    const button = document.querySelector<HTMLButtonElement>(`[data-copy-family="${expectedFamily}"]`)
    if (!value || !status || !button) return

    status.textContent = messages.checking

    try {
      const response = await fetch(PROBES[expectedFamily], {
        cache: 'no-store',
        signal: AbortSignal.timeout(5_000),
      })
      if (!response.ok) throw new Error(`Probe returned ${response.status}`)

      const result = await response.json() as ProbeResponse
      if (result.family !== expectedFamily) {
        throw new Error(`Expected ${expectedFamily}, received ${result.family}`)
      }

      value.textContent = result.ip
      status.textContent = messages.connected
      button.disabled = false
      button.onclick = async () => {
        try {
          await copyText(result.ip)
          status.textContent = messages.copied
          window.setTimeout(() => {
            status.textContent = messages.connected
          }, 1_800)
        } catch (error) {
          console.error(error)
          status.textContent = messages.failed
        }
      }
    } catch (error) {
      console.info(`${expectedFamily} probe unavailable`, error)
      value.textContent = '—'
      status.textContent = messages.unavailable
      button.disabled = true
    }
  }

  void probe('ipv4')
  void probe('ipv6')
})
