import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
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
            <p class="card-sub">输入时间描述，选择时区，即时换算</p>
          </div>
        </div>

        <div class="form">
          <div class="field">
            <textarea
              id="input-text"
              class="input"
              rows={2}
              placeholder="明天下午9点开会 / tomorrow 9am meeting"
              autocomplete="off"
              spellcheck={false}
            />
            <p id="error-msg" class="error-msg" aria-live="polite" />
          </div>

          <div class="tz-row">
            <label class="tz-field">
              <span class="tz-label">From</span>
              <select id="source-tz" class="tz-select" />
            </label>
            <span class="tz-arrow">→</span>
            <label class="tz-field">
              <span class="tz-label">To</span>
              <select id="target-tz" class="tz-select" />
            </label>
          </div>

          <button type="button" id="convert-btn" class="btn-convert">
            Convert
          </button>
        </div>

        <div id="result-area" class="result-area" aria-live="polite">
          <div class="result-placeholder">等待输入…</div>
        </div>

        <div class="chips">
          <button class="chip" data-fill="明天下午9点开会">明天下午9点开会</button>
          <button class="chip" data-fill="周五上午11点电话">周五上午11点电话</button>
          <button class="chip" data-fill="下周一 18:00 截止">下周一 18:00 截止</button>
          <button class="chip" data-fill="tomorrow 9am">tomorrow 9am</button>
        </div>
      </div>
    </div>
  )
})

export default app
