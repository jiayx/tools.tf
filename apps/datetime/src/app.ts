import { getOffsetMinutes, formatOffset, parseTime } from './convert'

type ZoneOption = {
  value: string
  label?: string
}

const zonePresets: ZoneOption[] = [
  { value: 'Asia/Shanghai' },
  { value: 'Asia/Tokyo' },
  { value: 'Asia/Singapore' },
  { value: 'Asia/Hong_Kong' },
  { value: 'Asia/Seoul' },
  { value: 'Asia/Kolkata' },
  { value: 'Europe/London' },
  { value: 'Europe/Paris' },
  { value: 'Europe/Berlin' },
  { value: 'America/New_York' },
  { value: 'America/Chicago' },
  { value: 'America/Denver' },
  { value: 'America/Los_Angeles' },
  { value: 'America/Vancouver' },
  { value: 'Australia/Sydney' },
  { value: 'Pacific/Auckland' },
  { value: 'UTC' },
]

const inputEl = document.querySelector<HTMLTextAreaElement>('#input-text')
const sourceSelect = document.querySelector<HTMLSelectElement>('#source-tz')
const targetSelect = document.querySelector<HTMLSelectElement>('#target-tz')
const resultArea = document.querySelector<HTMLDivElement>('#result-area')
const errorMsg = document.querySelector<HTMLParagraphElement>('#error-msg')
const convertBtn = document.querySelector<HTMLButtonElement>('#convert-btn')
const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.chip'))

function buildLabel(value: string, date = new Date()) {
  try {
    return `${value.replace(/_/g, ' ')} (${formatOffset(getOffsetMinutes(value, date))})`
  } catch {
    return value
  }
}

function populateSelect(select: HTMLSelectElement | null, zones: ZoneOption[]) {
  if (!select) return
  const now = new Date()
  select.innerHTML = ''
  zones.forEach((zone) => {
    const opt = document.createElement('option')
    opt.value = zone.value
    opt.textContent = zone.label ?? buildLabel(zone.value, now)
    select.appendChild(opt)
  })
}

function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
}

function getLang() {
  const saved = localStorage.getItem('lang')
  return saved || navigator.languages?.[0] || navigator.language || 'en'
}

function showError(msg: string) {
  if (errorMsg) errorMsg.textContent = msg
  resetResult()
}

function clearError() {
  if (errorMsg) errorMsg.textContent = ''
}

function resetResult() {
  if (!resultArea) return
  const placeholder = document.createElement('div')
  placeholder.className = 'result-placeholder'
  placeholder.textContent = '等待输入…'
  resultArea.replaceChildren(placeholder)
  resultArea.classList.remove('has-result')
}

function showResult({
  localTime,
  targetZone,
  targetOffset,
  sourceTime,
  sourceZone,
  sourceOffset,
  parsedText,
}: {
  localTime: string
  targetZone: string
  targetOffset: string
  sourceTime: string
  sourceZone: string
  sourceOffset: string
  parsedText: string
}) {
  if (!resultArea) return
  clearError()

  const main = document.createElement('div')
  main.className = 'result-main'
  const time = document.createElement('div')
  time.className = 'result-time'
  time.textContent = localTime
  const zone = document.createElement('div')
  zone.className = 'result-zone'
  zone.textContent = `${targetZone} · ${targetOffset}`
  main.append(time, zone)

  const source = document.createElement('div')
  source.className = 'result-source'
  const sourceLabel = document.createElement('span')
  sourceLabel.className = 'result-source-label'
  sourceLabel.textContent = '原始'
  const sourceValue = document.createElement('span')
  sourceValue.textContent = `${sourceTime} · ${sourceZone} · ${sourceOffset}`
  source.append(sourceLabel, sourceValue)

  const parsed = document.createElement('div')
  parsed.className = 'result-parsed'
  parsed.textContent = `解析片段：「${parsedText}」`

  resultArea.replaceChildren(main, source, parsed)
  resultArea.classList.add('has-result')
}

function convert() {
  if (!inputEl || !sourceSelect || !targetSelect) return
  const text = inputEl.value.trim()
  if (!text) {
    showError('')
    return
  }

  const sourceZone = sourceSelect.value
  const targetZone = targetSelect.value
  const result = parseTime(text, sourceZone, getLang())

  if ('error' in result) {
    showError(result.error)
    return
  }

  const { eventDate, parsedText } = result

  const targetFormatter = new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: targetZone,
  })
  const sourceFormatter = new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: sourceZone,
  })

  showResult({
    localTime: targetFormatter.format(eventDate),
    targetZone,
    targetOffset: formatOffset(getOffsetMinutes(targetZone, eventDate)),
    sourceTime: sourceFormatter.format(eventDate),
    sourceZone,
    sourceOffset: formatOffset(getOffsetMinutes(sourceZone, eventDate)),
    parsedText,
  })
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleConvert() {
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(convert, 400)
}

function setup() {
  const userZone = getUserTimeZone()
  const userLabel = `${buildLabel(userZone)} · 你的时区`
  const uniqueZones = [
    { value: userZone, label: userLabel },
    ...zonePresets.filter((z) => z.value !== userZone),
  ]

  populateSelect(sourceSelect, uniqueZones)
  populateSelect(targetSelect, uniqueZones)

  if (sourceSelect) sourceSelect.value = 'Asia/Shanghai'
  if (targetSelect) targetSelect.value = userZone

  inputEl?.addEventListener('input', scheduleConvert)
  sourceSelect?.addEventListener('change', convert)
  targetSelect?.addEventListener('change', convert)
  convertBtn?.addEventListener('click', convert)

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      const text = chip.dataset.fill
      if (text && inputEl) {
        inputEl.value = text
        inputEl.focus()
        convert()
      }
    })
  )
}

setup()
