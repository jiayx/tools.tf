import * as chrono from 'chrono-node'

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
  { value: 'UTC' }
]

const input = document.querySelector<HTMLTextAreaElement>('#input-text')
const form = document.querySelector<HTMLFormElement>('#converter-form')
const sourceSelect = document.querySelector<HTMLSelectElement>('#source-tz')
const targetSelect = document.querySelector<HTMLSelectElement>('#target-tz')
const resultBox = document.querySelector<HTMLDivElement>('#result')
const detailsBox = document.querySelector<HTMLDivElement>('#details')
const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.chip'))

function getOffsetMinutes(timeZone: string, date = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const parts = dtf.formatToParts(date)
  const filled: Record<string, number> = {}
  for (const part of parts) {
    if (part.type !== 'literal') {
      filled[part.type] = Number(part.value)
    }
  }
  const asUTC = Date.UTC(
    filled.year,
    filled.month - 1,
    filled.day,
    filled.hour,
    filled.minute,
    filled.second
  )
  return Math.round((asUTC - date.getTime()) / 60000)
}

function formatOffset(offsetMinutes: number) {
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMinutes)
  const hours = String(Math.floor(abs / 60)).padStart(2, '0')
  const minutes = String(abs % 60).padStart(2, '0')
  return `UTC${sign}${hours}:${minutes}`
}

function buildLabel(value: string, date = new Date()) {
  try {
    return `${value.replace(/_/g, ' ')}（${formatOffset(getOffsetMinutes(value, date))}）`
  } catch (e) {
    return value
  }
}

function populateSelect(select: HTMLSelectElement | null, zones: ZoneOption[]) {
  if (!select) return
  const now = new Date()
  select.innerHTML = ''
  zones.forEach((zone) => {
    const option = document.createElement('option')
    option.value = zone.value
    option.textContent = zone.label ?? buildLabel(zone.value, now)
    select.appendChild(option)
  })
}

function setResult({
  localTime,
  targetZoneLabel,
  sourceZoneLabel,
  sourceTime,
  parsedText
}: {
  localTime: string
  targetZoneLabel: string
  sourceZoneLabel: string
  sourceTime: string
  parsedText: string
}) {
  if (!resultBox || !detailsBox) return
  resultBox.innerHTML = ''
  detailsBox.innerHTML = ''

  const primary = document.createElement('div')
  primary.className = 'time-big'
  primary.textContent = localTime

  const targetLine = document.createElement('p')
  targetLine.className = 'muted'
  targetLine.textContent = `你的时区 · ${targetZoneLabel}`

  const compare = document.createElement('div')
  compare.className = 'compare'
  const compareTitle = document.createElement('p')
  compareTitle.textContent = '原始时间'
  compareTitle.className = 'label'
  const compareTime = document.createElement('p')
  compareTime.className = 'small'
  compareTime.textContent = `${sourceTime} · ${sourceZoneLabel}`
  compare.appendChild(compareTitle)
  compare.appendChild(compareTime)

  resultBox.appendChild(primary)
  resultBox.appendChild(targetLine)
  resultBox.appendChild(compare)

  const ref = document.createElement('p')
  ref.className = 'muted'
  ref.textContent = `解析片段：“${parsedText}”`
  detailsBox.appendChild(ref)
}

function setError(message: string) {
  if (!resultBox || !detailsBox) return
  resultBox.innerHTML = `<p class="muted">${message}</p>`
  detailsBox.innerHTML = ''
}

function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
}

function setup() {
  const userZone = getUserTimeZone()
  const userLabel = `${buildLabel(userZone)} · 你的时区`
  const uniqueZones = [
    { value: userZone, label: userLabel },
    ...zonePresets.filter((z) => z.value !== userZone)
  ]

  populateSelect(sourceSelect, uniqueZones)
  populateSelect(targetSelect, uniqueZones)

  if (sourceSelect) {
    sourceSelect.value = 'Asia/Shanghai'
  }
  if (targetSelect) {
    targetSelect.value = userZone
  }

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      const text = chip.dataset.fill
      if (text && input) {
        input.value = text
        input.focus()
      }
    })
  )

  form?.addEventListener('submit', (event) => {
    event.preventDefault()
    convert()
  })
}

function getChrono() {
  const saved = localStorage.getItem('lang') // 'zh' | 'en' | etc.
  const lang = saved || (navigator.languages?.[0] || navigator.language || 'en')
  if (lang.toLowerCase().startsWith('zh')) return chrono.zh
  if (lang.toLowerCase().startsWith('ja')) return chrono.ja
  // 可继续扩展
  return chrono
}

function makeSemanticNow(offsetMinutes: number) {
  const now = new Date();
  return new Date(now.getTime() + offsetMinutes * 60 * 1000);
}

function convert() {
  if (!input || !sourceSelect || !targetSelect) return
  const text = input.value.trim()
  if (!text) {
    setError('请输入要换算的时间描述')
    return
  }

  const sourceZone = sourceSelect.value
  const targetZone = targetSelect.value

  let sourceOffset = 0
  try {
    sourceOffset = getOffsetMinutes(sourceZone)
  } catch (e) {
    setError('原始时区无效，请重新选择')
    return
  }

  const chronoInstance = getChrono()

  const results = chronoInstance.parse(text, { instant: makeSemanticNow(sourceOffset), timezone: sourceOffset })
  const parsed = results[0]
  if (!parsed) {
    setError('没有解析出时间，试试补充日期或时间段')
    return
  }

  const eventDate = parsed.date()

  const targetFormatter = new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: targetZone
  })
  const sourceFormatter = new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: sourceZone
  })

  const targetOffset = formatOffset(getOffsetMinutes(targetZone, eventDate))
  const sourceOffsetLabel = formatOffset(getOffsetMinutes(sourceZone, eventDate))

  setResult({
    localTime: targetFormatter.format(eventDate),
    targetZoneLabel: `${targetZone} · ${targetOffset}`,
    sourceZoneLabel: `${sourceZone} · ${sourceOffsetLabel}`,
    sourceTime: sourceFormatter.format(eventDate),
    parsedText: parsed.text
  })
}

setup()
