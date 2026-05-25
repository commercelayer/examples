import { createHmac } from 'node:crypto'
import { Hono } from 'hono'
import { createMollieClient } from '@mollie/api-client'

export const mollieWebhookRoute = new Hono()

/**
 * POST /mollie-webhook
 *
 * Called by Mollie when a payment status changes.
 * Mollie sends a form-encoded body with a single `id` field (the payment ID).
 *
 * We fetch the payment status from Mollie and, if paid, call Commerce Layer's
 * webhook_endpoint_url with the action_id (= Mollie payment ID) to complete
 * the async authorization.
 */
mollieWebhookRoute.post('/', async (c) => {
  const body = await c.req.parseBody()
  const paymentId = body['id'] as string | undefined

  if (!paymentId) {
    console.warn('⚠️  Mollie webhook received without payment id')
    return c.text('Missing id', 400)
  }

  console.log(`📩 Mollie webhook received for payment: ${paymentId}`)

  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) {
    console.error('MOLLIE_API_KEY not set')
    return c.text('Gateway misconfigured', 500)
  }

  try {
    const mollie = createMollieClient({ apiKey: mollieApiKey })
    const payment = await mollie.payments.get(paymentId)

    console.log(`   Mollie payment status: ${payment.status}`)

    if (payment.status === 'paid') {
      await notifyCL(paymentId)
    } else {
      console.log(`   Payment not yet paid (status: ${payment.status}) — skipping CL webhook`)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Failed to handle Mollie webhook:', message)
    return c.text('Internal error', 500)
  }

  // Mollie expects a 200 OK — always return it regardless of our processing
  return c.text('OK')
})

async function notifyCL(actionId: string) {
  const webhookUrl = process.env.CL_WEBHOOK_ENDPOINT_URL
  if (!webhookUrl) {
    console.warn('⚠️  CL_WEBHOOK_ENDPOINT_URL not set — skipping CL webhook')
    return
  }

  const payload = {
    success: true,
    data: {
      action_id: actionId,
      message: 'Payment authorized via Mollie',
    },
  }

  const rawBody = JSON.stringify(payload)
  const secret = process.env.CL_GATEWAY_SHARED_SECRET
  const signature = secret
    ? createHmac('sha256', secret).update(rawBody).digest('base64')
    : undefined

  console.log(`📡 Notifying CL webhook with action_id: ${actionId}`)

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(signature ? { 'X-CommerceLayer-Signature': signature } : {}),
    },
    body: rawBody,
  })

  if (res.ok) {
    console.log(`✅ CL webhook accepted (${res.status})`)
  } else {
    const text = await res.text()
    console.error(`❌ CL webhook rejected (${res.status}): ${text}`)
  }
}
