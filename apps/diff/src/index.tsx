import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <main class="page">
      <header class="hero">
        <div>
          <p class="eyebrow">Diff Studio</p>
          <h1>Live side-by-side text diff</h1>
        </div>
      </header>

      <section class="workbench">
        <div class="merge-panel">
          <div class="merge-head">
            <span class="diff-hint">Editable diff</span>
          </div>
          <div id="merge-root" class="merge-root"></div>
        </div>
      </section>
    </main>
  )
})

export default app
