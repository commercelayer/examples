import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { authorizeRoute } from './routes/authorize.js'
import { initiatePaymentRoute } from './routes/initiate-payment.js'
import { mollieWebhookRoute } from './routes/mollie-webhook.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: process.env.APP_RETURN_URL?.replace('/return', '') ?? '*' }))

app.route('/authorize', authorizeRoute)
app.route('/initiate-payment', initiatePaymentRoute)
app.route('/mollie-webhook', mollieWebhookRoute)

app.get('/health', (c) => c.json({ ok: true }))

const port = Number(process.env.PORT ?? 3001)

console.log(`🚀 Gateway running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
