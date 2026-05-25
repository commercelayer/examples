import { Hono } from 'hono'
import { html } from 'hono/html'
import { getCLClient } from '../lib/cl.js'

export const payRoute = new Hono()

/**
 * GET /pay?order_id=xxx
 *
 * Renders a simple "payment page" that simulates what an external payment
 * provider would show. Displays order details and a "Pay Now" button.
 */
payRoute.get('/', async (c) => {
  const orderId = c.req.query('order_id')
  if (!orderId) {
    return c.html(errorPage('Missing order_id query parameter'), 400)
  }

  let orderNumber = ''
  let totalAmount = ''
  let currency = ''

  try {
    const cl = await getCLClient()
    const order = await cl.orders.retrieve(orderId)
    orderNumber = order.number ?? orderId
    totalAmount = order.formatted_total_amount ?? '—'
    currency = order.currency_code ?? ''
  } catch (err) {
    console.error('Failed to fetch order:', err)
    return c.html(errorPage('Could not load order details. Check your CL credentials.'), 500)
  }

  return c.html(paymentPage({ orderId, orderNumber, totalAmount, currency }))
})

/**
 * POST /pay
 *
 * Called when the user clicks "Confirm payment". The order is already placed
 * by the SPA before redirecting here — this just sends the user back to the
 * SPA's /return page where they will see the payment status transition from
 * pending to authorized once the gateway fires the webhook callback.
 */
payRoute.post('/', async (c) => {
  const body = await c.req.parseBody()
  const orderId = body['order_id'] as string | undefined

  if (!orderId) {
    return c.html(errorPage('Missing order_id'), 400)
  }

  const returnUrl = process.env.APP_RETURN_URL ?? 'http://localhost:5173/return'

  console.log(`✅ User confirmed payment for order ${orderId} — redirecting back to SPA`)

  return c.redirect(`${returnUrl}?order_id=${orderId}`)
})

// ---------------------------------------------------------------------------
// HTML templates
// ---------------------------------------------------------------------------

function paymentPage({
  orderId,
  orderNumber,
  totalAmount,
  currency,
}: {
  orderId: string
  orderNumber: string
  totalAmount: string
  currency: string
}) {
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mollie Payment Gateway</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1rem;
          }
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
            padding: 2.5rem;
            width: 100%;
            max-width: 420px;
          }
          .badge {
            display: inline-block;
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffc107;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.6rem;
            margin-bottom: 1.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          h1 {
            font-size: 1.4rem;
            margin-bottom: 0.4rem;
            color: #111;
          }
          .subtitle {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 2rem;
          }
          .order-box {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1.25rem;
            margin-bottom: 2rem;
          }
          .order-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
            color: #444;
            margin-bottom: 0.5rem;
          }
          .order-row:last-child {
            margin-bottom: 0;
            font-weight: 600;
            color: #111;
            font-size: 1rem;
            padding-top: 0.5rem;
            border-top: 1px solid #dee2e6;
            margin-top: 0.5rem;
          }
          .pay-btn {
            width: 100%;
            padding: 0.9rem;
            background: #0070f3;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s;
          }
          .pay-btn:hover {
            background: #0051bb;
          }
          .pay-btn:active {
            background: #003d8f;
          }
          .async-note {
            margin-top: 1.25rem;
            font-size: 0.8rem;
            color: #888;
            text-align: center;
            line-height: 1.5;
          }
          .async-note strong {
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">💳 Mollie Payment Gateway</div>
          <h1>Complete your payment</h1>
          <p class="subtitle">Order #${orderNumber}</p>

          <div class="order-box">
            <div class="order-row">
              <span>Order ID</span>
              <span style="font-family:monospace;font-size:0.8rem">${orderId}</span>
            </div>
            <div class="order-row">
              <span>Currency</span>
              <span>${currency}</span>
            </div>
            <div class="order-row">
              <span>Total</span>
              <span>${totalAmount}</span>
            </div>
          </div>

          <form method="POST" action="/pay">
            <input type="hidden" name="order_id" value="${orderId}" />
            <button type="submit" class="pay-btn">Pay ${totalAmount}</button>
          </form>

          <p class="async-note">
            <strong>Demo note:</strong> Clicking Pay will place the order asynchronously.
            The authorization will be confirmed ~3 seconds after redirect.
          </p>
        </div>
      </body>
    </html>`
}

function errorPage(message: string) {
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Error — Mollie Gateway</title>
        <style>
          body {
            font-family: sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #fff5f5;
          }
          .box {
            background: white;
            border: 1px solid #feb2b2;
            border-radius: 8px;
            padding: 2rem;
            max-width: 400px;
            text-align: center;
          }
          h1 {
            color: #c53030;
            margin-bottom: 1rem;
          }
          p {
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>Gateway Error</h1>
          <p>${message}</p>
        </div>
      </body>
    </html>`
}
