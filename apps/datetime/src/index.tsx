import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <main className="page">
      <header className="hero">
        <h1>跨时区时间助手</h1>
        <p className="lead">
          输入对方的时间描述，选择对方所在时区，即刻得到你所在时区的实际时间
        </p>
      </header>

      <section className="grid">
        <section className="card form-card">
          <form id="converter-form" className="form">
            <label className="field">
              <span>原始时区（对方所在）</span>
              <select id="source-tz" name="source-tz"></select>
            </label>

            <label className="field">
              <span>时间描述</span>
              <textarea
                id="input-text"
                name="input-text"
                rows={3}
                placeholder="例：明天下午 9 点开会"
                required
              ></textarea>
              <div className="helper">支持自然语言，如 “本周五 14:30” / “下周一早上 8 点”</div>
            </label>

            <label className="field">
              <span>你的时区</span>
              <select id="target-tz" name="target-tz"></select>
            </label>

            <button type="submit" className="primary">换算时间</button>
          </form>

          <div className="chips" aria-label="示例">
            <button className="chip" data-fill="明天下午 9 点开会">明天下午 9 点开会</button>
            <button className="chip" data-fill="周五上午 11 点电话沟通">周五上午 11 点电话沟通</button>
            <button className="chip" data-fill="下周一 18:00 截止">下周一 18:00 截止</button>
          </div>
        </section>

        <section className="card result-card">
          <div id="result" className="result">
            <p className="muted">等待输入...</p>
          </div>
          <div id="details" className="details"></div>
        </section>
      </section>

      <section className="info">
        <div>
          <p className="label">工作方式</p>
          <h3>Chrono 解析 + 时区换算</h3>
          <p className="muted">
            使用 chrono 将自然语言解析为具体时间，通过所选原始时区得到事件的真实时间，再转换为你的本地时区。
          </p>
        </div>
        <div className="list">
          <div>
            <p className="label">实用小贴士</p>
            <ul>
              <li>描述里不需要重复写时区，直接选择对方所在时区即可。</li>
              <li>结果同时显示来源时区和你的时区，方便 cross-check。</li>
              <li>使用浏览器自动识别你的时区，可随时切换。</li>
            </ul>
          </div>
          <div>
            <p className="label">常见用法</p>
            <ul>
              <li>“纽约时间本周三早上 10 点开会” → 选择 America/New_York。</li>
              <li>“周日晚上 8 点提交” → 选择对方时区，得到你的当地时间。</li>
              <li>“下周二 15:30 demo” → 对方时区选北京，秒算你的时间。</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
})

export default app
