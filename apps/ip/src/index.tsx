import { localeTag, pick, resolveLocale, type Locale } from '@tools/i18n'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { renderer } from './renderer'

type CfFields = Partial<IncomingRequestCfProperties>

export type IpDetails = {
  ip: string
  country: string
  city?: string
  region?: string
  timezone?: string
  latitude?: string
  longitude?: string
  organization?: string
  postalCode?: string
  continent?: string
  userAgent?: string
  isCurl: boolean
}

const app = new Hono()

app.use(renderer)
app.use('*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store')
  c.header('X-Content-Type-Options', 'nosniff')
})

export const collectIpDetails = (c: Context): IpDetails => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'Unknown'
  const country = c.req.header('CF-IPCountry') ?? 'Unknown'
  const userAgent = c.req.header('User-Agent') ?? undefined
  const rawCf = (c.req.raw as Request & { cf?: CfFields }).cf ?? {}

  const city = rawCf.city
  const region = rawCf.region ?? rawCf.regionCode
  const timezone = rawCf.timezone
  const longitude = rawCf.longitude
  const latitude = rawCf.latitude
  const organization = rawCf.asOrganization
  const postalCode = rawCf.postalCode
  const continent = rawCf.continent

  const isCurl = userAgent ? /^curl\//i.test(userAgent) : false

  return {
    ip,
    country,
    city,
    region,
    timezone,
    longitude,
    latitude,
    organization,
    postalCode,
    continent,
    userAgent,
    isCurl,
  }
}

const IpPage = ({ details, locale }: { details: IpDetails; locale: Locale }) => {
  const unavailable = pick(locale, { en: 'Unavailable', zh: '暂无数据' })
  const checking = pick(locale, { en: 'Checking…', zh: '检测中…' })
  const locationLine = [details.city, details.region].filter(Boolean).join(', ') || unavailable
  const coordinates =
    details.latitude && details.longitude ? `${details.latitude}, ${details.longitude}` : unavailable
  const postal = details.postalCode
    ? `${pick(locale, { en: 'Postal code', zh: '邮政编码' })} ${details.postalCode}`
    : ''
  const orgLine = details.organization ?? unavailable
  const timestamp = new Date().toLocaleString(localeTag(locale), { timeZone: details.timezone ?? 'UTC' })

  return (
    <div class="page">
      <main class="card">
        <header class="card__header">
          <div class="card__header-main">
            <p class="eyebrow">{pick(locale, { en: 'Current outbound IP', zh: '当前出口 IP' })}</p>
            <h1 class="title">{details.ip}</h1>
          </div>
          <div class="badge">{details.country}</div>
        </header>

        <section class="address-grid" aria-label={pick(locale, {
          en: 'IPv4 and IPv6 connectivity',
          zh: 'IPv4 与 IPv6 连接状态',
        })}>
          <article class="address-card">
            <div>
              <p class="address-card__label">IPv4</p>
              <p class="address-card__value" data-ip-family="ipv4">{checking}</p>
              <p class="address-card__status" data-ip-status="ipv4">{checking}</p>
            </div>
            <button
              class="copy-btn"
              type="button"
              data-copy-family="ipv4"
              disabled
            >
              {pick(locale, { en: 'Copy', zh: '复制' })}
            </button>
          </article>

          <article class="address-card">
            <div>
              <p class="address-card__label">IPv6</p>
              <p class="address-card__value" data-ip-family="ipv6">{checking}</p>
              <p class="address-card__status" data-ip-status="ipv6">{checking}</p>
            </div>
            <button
              class="copy-btn"
              type="button"
              data-copy-family="ipv6"
              disabled
            >
              {pick(locale, { en: 'Copy', zh: '复制' })}
            </button>
          </article>
        </section>

        <section class="grid">
          <article class="tile">
            <p class="tile__label">{pick(locale, { en: 'Location', zh: '位置' })}</p>
            <p class="tile__value">{locationLine}</p>
            <p class="tile__hint">{postal || pick(locale, {
              en: 'City & region from edge headers',
              zh: '基于边缘请求头的城市与地区',
            })}</p>
          </article>

          <article class="tile">
            <p class="tile__label">{pick(locale, { en: 'Timezone', zh: '时区' })}</p>
            <p class="tile__value">{details.timezone ?? unavailable}</p>
            <p class="tile__hint">{pick(locale, { en: 'Local time', zh: '当地时间' })} · {timestamp}</p>
          </article>

          <article class="tile">
            <p class="tile__label">{pick(locale, { en: 'Coordinates', zh: '坐标' })}</p>
            <p class="tile__value">{coordinates}</p>
            <p class="tile__hint">{pick(locale, { en: 'Longitude / Latitude', zh: '经度 / 纬度' })}</p>
          </article>

          <article class="tile">
            <p class="tile__label">{pick(locale, { en: 'Network', zh: '网络' })}</p>
            <p class="tile__value">{orgLine}</p>
            <p class="tile__hint">{pick(locale, { en: 'AS organization', zh: 'AS 组织' })}</p>
          </article>
        </section>

        <section class="meta">
          {details.userAgent && (
            <pre class="ua" aria-label={pick(locale, { en: 'User agent', zh: '用户代理' })}>{details.userAgent}</pre>
          )}
        </section>
      </main>
    </div>
  )
}

app.get('/', (c) => {
  const details = collectIpDetails(c)
  const format = c.req.query('format')
  const locale = resolveLocale(c.req.header('Accept-Language'))

  if (format === 'json' || c.req.header('Accept')?.includes('application/json')) {
    return c.json(details)
  }

  if (details.isCurl || format === 'text') {
    return c.text(`${details.ip}\n`)
  }

  return c.render(<IpPage details={details} locale={locale} />)
})

export default app
