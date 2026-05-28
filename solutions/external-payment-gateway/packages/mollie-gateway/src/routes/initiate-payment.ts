import { Hono } from 'hono'
import { createMollieClient } from '@mollie/api-client'
import { getCLClient } from '../lib/cl.js'

export const initiatePaymentRoute = new Hono()

/**
 * POST /initiate-payment
 * Body: { order_id: string }
 *
 * Called by the SPA before placing the order. We:
 * 1. Fetch the order from CL to get amount + currency
 * 2. Create a Mollie payment in test mode
 * 3. Return the Mollie checkout URL and payment ID
 *
 * The SPA then sets payment_source_token = paymentId on the external_payment
 * resource, places the order (triggering /authorize), and redirects the user
 * to the Mollie checkout URL.
 */
initiatePaymentRoute.post('/', async (c) => {
  const { order_id: orderId } = await c.req.json<{ order_id: string }>()

  console.log(`🚀 /initiate-payment called for order ${orderId}`)
  
  if (!orderId) {
    return c.json({ error: 'Missing order_id' }, 400)
  }

  const mollieApiKey = process.env.MOLLIE_API_KEY
  if (!mollieApiKey) {
    return c.json({ error: 'MOLLIE_API_KEY not configured' }, 500)
  }

  const returnBase = process.env.APP_RETURN_URL ?? 'http://localhost:5173/return'
  const gatewayPublicUrl = process.env.GATEWAY_PUBLIC_URL

  if (!gatewayPublicUrl) {
    return c.json({ error: 'GATEWAY_PUBLIC_URL not configured' }, 500)
  }

  try {
    const cl = await getCLClient()
    const order = await cl.orders.retrieve(orderId, {
      fields: ['number', 'total_amount_cents', 'currency_code'],
    })

    if (!order.total_amount_cents || !order.currency_code) {
      return c.json({ error: 'Order is missing amount or currency' }, 422)
    }

    const mollie = createMollieClient({ apiKey: mollieApiKey })


    console.log(`Creating Mollie payment for order ${orderId} with amount ${order.total_amount_cents} ${order.currency_code}` + ` and return URL ${returnBase}?order_id=${orderId}`)
    const payment = await mollie.payments.create({
      amount: {
        currency: order.currency_code,
        value: (order.total_amount_cents / 100).toFixed(2),
      },
      description: `Order #${order.number ?? orderId}`,
      redirectUrl: `${returnBase}?order_id=${orderId}`,
      webhookUrl: `${gatewayPublicUrl}/mollie-webhook`,
      metadata: { order_id: orderId },
    })

    console.log(`🧾 Mollie payment created: ${payment.id} for order ${orderId}`)

    const checkoutUrl = payment._links.checkout?.href
    if (!checkoutUrl) {
      return c.json({ error: 'Mollie did not return a checkout URL' }, 500)
    }

    return c.json({ paymentId: payment.id, checkoutUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Failed to create Mollie payment:', message)
    return c.json({ error: message }, 500)
  }
})
