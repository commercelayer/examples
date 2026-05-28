import { createHmac } from 'node:crypto'
import { Hono } from 'hono'
import { verifySignature } from '../lib/signature.js'

export const authorizeRoute = new Hono()

/**
 * POST /authorize
 *
 * Called by Commerce Layer when the order is placed.
 * We respond with HTTP 202 + action_id to trigger the async payment flow.
 *
 * The action_id is the Mollie payment ID stored in payment_source_token by
 * the SPA before placing the order. Commerce Layer will mark the payment as
 * authorized when we call back the webhook_endpoint_url — which happens via
 * the /mollie-webhook route once Mollie confirms the payment.
 */
authorizeRoute.post('/', async (c) => {
  const rawBody = await c.req.text()
  const signature = c.req.header('X-CommerceLayer-Signature')

  if (!verifySignature(rawBody, signature)) {
    console.error('❌ Invalid signature on /authorize request')
    return c.json({ error: { code: 'INVALID_SIGNATURE', message: 'Signature mismatch' } }, 401)
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return c.json({ error: { code: 'INVALID_BODY', message: 'Could not parse JSON' } }, 400)
  }

  const paymentData = body?.data as Record<string, unknown> | undefined
  const paymentId = paymentData?.id as string | undefined

  // payment_source_token holds the Mollie payment ID set by the SPA
  const paymentSourceToken = (paymentData as any)?.attributes
    ?.payment_source_token as string | undefined

  const included = body?.included as { type: string; attributes: Record<string, unknown> }[] | undefined
  const orderResource = included?.find((r) => r.type === 'orders')
  const amountCents = orderResource?.attributes?.total_amount_cents as number | undefined

  if (!paymentSourceToken) {
    console.error('❌ Missing payment_source_token in /authorize payload')
    return c.json(
      { error: { code: 'MISSING_TOKEN', message: 'payment_source_token is required' } },
      400,
    )
  }

  // Use the Mollie payment ID as the action_id — this is what we'll send back
  // to CL's webhook_endpoint_url once Mollie confirms the payment
  const actionId = paymentSourceToken
  const transactionToken = `cl-txn-${paymentId ?? 'unknown'}-${Date.now()}`

  console.log(`✅ /authorize received for payment ${paymentId}`)
  console.log(`   Mollie payment ID (action_id): ${actionId}`)
  console.log(`   Responding 202 — waiting for Mollie webhook to confirm`)

  return c.json(
    {
      success: true,
      data: {
        transaction_token: transactionToken,
        amount_cents: amountCents ?? 0,
        action_id: actionId,
        metadata: { mollie_payment_id: actionId },
      },
    },
    202,
  )
})
