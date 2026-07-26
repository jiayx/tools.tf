import { pick, resolveLocale } from '@tools/i18n'
import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
  const locale = resolveLocale(c.req.header('Accept-Language'))
  const copy = pick(locale, {
    en: {
      subtitle: 'Describe a time, choose two timezones, and convert it instantly',
      placeholder: 'tomorrow at 9am / Friday 11am call',
      from: 'From',
      to: 'To',
      convert: 'Convert',
      waiting: 'Waiting for input…',
      examples: [
        'tomorrow at 9am',
        'Friday at 11am',
        'next Monday 6pm deadline',
        'tonight at 8pm',
      ],
    },
    zh: {
      subtitle: '输入时间描述，选择时区，即时换算',
      placeholder: '明天下午9点开会 / tomorrow 9am meeting',
      from: '原时区',
      to: '目标时区',
      convert: '转换',
      waiting: '等待输入…',
      examples: [
        '明天下午9点开会',
        '周五上午11点电话',
        '下周一 18:00 截止',
        'tomorrow 9am',
      ],
    },
  })
  return c.render(
    <div class="page">
      <div class="card">
        <div class="card-header">
          <img
            class="card-icon"
            src="https://icon.tools.tf/icon/64?type=tabler&fg=%231946ae&bg=transparent&glyph=100&icon=timezone"
            alt=""
            width="40"
            height="40"
          />
          <div>
            <h1 class="card-title">Timezone Converter</h1>
            <p class="card-sub">{copy.subtitle}</p>
          </div>
        </div>

        <div class="form">
          <div class="field">
            <textarea
              id="input-text"
              class="input"
              rows={2}
              placeholder={copy.placeholder}
              autocomplete="off"
              spellcheck={false}
            />
            <p id="error-msg" class="error-msg" aria-live="polite" />
          </div>

          <div class="tz-row">
            <label class="tz-field">
              <span class="tz-label">{copy.from}</span>
              <select id="source-tz" class="tz-select" />
            </label>
            <span class="tz-arrow">→</span>
            <label class="tz-field">
              <span class="tz-label">{copy.to}</span>
              <select id="target-tz" class="tz-select" />
            </label>
          </div>

          <button type="button" id="convert-btn" class="btn-convert">
            {copy.convert}
          </button>
        </div>

        <div id="result-area" class="result-area" aria-live="polite">
          <div class="result-placeholder">{copy.waiting}</div>
        </div>

        <div class="chips">
          {copy.examples.map((example) => (
            <button class="chip" data-fill={example}>{example}</button>
          ))}
        </div>
      </div>
    </div>
  )
})

export default app
