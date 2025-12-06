import { Hono } from 'hono'
import type { Context } from 'hono'
import { renderer } from './renderer'

type CfFields = Partial<IncomingRequestCfProperties>

type IpDetails = {
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

const collectIpDetails = (c: Context): IpDetails => {
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

const IpPage = ({ details }: { details: IpDetails }) => {
  const locationLine = [details.city, details.region].filter(Boolean).join(', ') || 'Unavailable'
  const coordinates =
    details.latitude && details.longitude ? `${details.latitude}, ${details.longitude}` : 'Unavailable'
  const postal = details.postalCode ? `Postal code ${details.postalCode}` : ''
  const orgLine = details.organization ?? 'Unavailable'
  const timestamp = new Date().toLocaleString('en-US', { timeZone: details.timezone ?? 'UTC' })

  return (
    <div class="page">
      <main class="card">
        <header class="card__header">
          <div>
            <p class="eyebrow">Your network snapshot</p>
            <div class="ip-line">
              <h1 class="title">{details.ip}</h1>
              <button class="copy-btn" type="button" data-copy-ip={details.ip}>
                Copy
              </button>
              <span class="copy-status" data-copy-status>
                Copy
              </span>
            </div>
            <p class="subtitle">Public IP address</p>
          </div>
          <div class="badge">{details.country}</div>
        </header>

        <section class="grid">
          <article class="tile">
            <p class="tile__label">Location</p>
            <p class="tile__value">{locationLine}</p>
            <p class="tile__hint">{postal || 'City & region from edge headers'}</p>
          </article>

          <article class="tile">
            <p class="tile__label">Timezone</p>
            <p class="tile__value">{details.timezone ?? 'Unavailable'}</p>
            <p class="tile__hint">Local time · {timestamp}</p>
          </article>

          <article class="tile">
            <p class="tile__label">Coordinates</p>
            <p class="tile__value">{coordinates}</p>
            <p class="tile__hint">Longitude / Latitude</p>
          </article>

          <article class="tile">
            <p class="tile__label">Network</p>
            <p class="tile__value">{orgLine}</p>
            <p class="tile__hint">AS organization</p>
          </article>
        </section>

        <section class="meta">
          {details.userAgent && (
            <pre class="ua" aria-label="User agent">{details.userAgent}</pre>
          )}
        </section>
      </main>
    </div>
  )
}

app.get('/', (c) => {
  const details = collectIpDetails(c)

  if (details.isCurl) {
    return c.text(`${details.ip}\n`)
  }

  return c.render(<IpPage details={details} />)
})

export default app
