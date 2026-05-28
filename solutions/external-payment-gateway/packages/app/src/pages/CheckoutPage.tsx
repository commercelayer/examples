import { useState } from 'react'
import { getCLClient, CL_SKU_CODE, GATEWAY_URL } from '../lib/cl'

type CheckoutMode = 'place' | 'authorize'

type Step =
  | 'idle'
  | 'creating-order'
  | 'adding-line-item'
  | 'adding-addresses'
  | 'adding-shipping'
  | 'adding-payment'
  | 'ready'
  | 'error'

interface StepLog {
  label: string
  status: 'pending' | 'done' | 'error'
}

const STEP_LABELS: Record<Step, string> = {
  idle: 'Not started',
  'creating-order': 'Creating order…',
  'adding-line-item': 'Adding line item…',
  'adding-addresses': 'Setting billing & shipping address…',
  'adding-shipping': 'Selecting shipping method…',
  'adding-payment': 'Attaching external payment source…',
  ready: 'Placing order…',
  error: 'Error',
}

export function CheckoutPage() {
  const [step, setStep] = useState<Step>('idle')
  const [logs, setLogs] = useState<StepLog[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  function addLog(label: string, status: StepLog['status'] = 'pending') {
    setLogs((prev) => [...prev, { label, status }])
  }

  function resolveLastLog(status: 'done' | 'error') {
    setLogs((prev) => {
      const updated = [...prev]
      if (updated.length > 0) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], status }
      }
      return updated
    })
  }

  async function handleStart(mode: CheckoutMode) {
    setLogs([])
    setErrorMsg('')
    setStep('creating-order')

    try {
      const cl = await getCLClient()

      // ── 1. Create the order ──────────────────────────────────────────────
      addLog('Creating order')
      const order = await cl.orders.create({ customer_email: 'matteo@commercelayer.io' })
      resolveLastLog('done')

      // ── 2. Add a line item ───────────────────────────────────────────────
      setStep('adding-line-item')
      addLog(`Adding SKU: ${CL_SKU_CODE}`)
      await cl.line_items.create({
        order: cl.orders.relationship(order.id),
        sku_code: CL_SKU_CODE,
        quantity: 1,
        _update_quantity: true,
      })
      resolveLastLog('done')

      // ── 3. Create & attach addresses ─────────────────────────────────────
      setStep('adding-addresses')
      addLog('Setting billing & shipping address')

      const address = await cl.addresses.create({
        first_name: 'John',
        last_name: 'Doe',
        line_1: '123 Demo Street',
        city: 'Milan',
        zip_code: '20100',
        state_code: 'MI',
        country_code: 'IT',
        phone: '+39 02 1234567',
        billing_info: 'ACME Inc. – VAT IT12345678901',
      })

      await cl.orders.update({
        id: order.id,
        billing_address: cl.addresses.relationship(address.id),
        _shipping_address_same_as_billing: true,
      })
      resolveLastLog('done')

      // ── 4. Select a shipping method ──────────────────────────────────────
      setStep('adding-shipping')
      addLog('Selecting shipping method')

      const orderWithShipments = await cl.orders.retrieve(order.id, {
        include: [
          'shipments',
          'shipments.available_shipping_methods',
          'available_payment_methods',
        ],
      })

      const shipment = orderWithShipments.shipments?.[0]
      if (!shipment) throw new Error('No shipments found for the order')

      const shippingMethods = (shipment as any).available_shipping_methods as
        | { id: string }[]
        | undefined

      if (!shippingMethods?.length) {
        throw new Error('No shipping methods available — check your CL market configuration')
      }

      await cl.shipments.update({
        id: shipment.id,
        shipping_method: cl.shipping_methods.relationship(shippingMethods[0].id),
      })
      resolveLastLog('done')

      // ── 5. Attach external payment source ────────────────────────────────
      setStep('adding-payment')
      addLog('Attaching external payment source')

      const availablePaymentMethods = (orderWithShipments as any).available_payment_methods as
        | { id: string; payment_source_type: string }[]
        | undefined

      const externalPaymentMethod = availablePaymentMethods?.find(
        (pm) => pm.payment_source_type === 'external_payments',
      )

      if (!externalPaymentMethod) {
        throw new Error(
          'No external payment method found — make sure your market has an external gateway configured',
        )
      }

      await cl.orders.update({
        id: order.id,
        payment_method: cl.payment_methods.relationship(externalPaymentMethod.id),
      })

      // ── 6. Create Mollie payment ──────────────────────────────────────────
      // Ask the gateway to create a Mollie payment and get back the checkout
      // URL + Mollie payment ID. The ID is stored as payment_source_token so
      // the gateway can use it as action_id in the async /authorize response.
      addLog('Creating Mollie payment…')

      const mollieRes = await fetch(`${GATEWAY_URL}/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      })

      if (!mollieRes.ok) {
        const errBody = await mollieRes.json().catch(() => ({}))
        throw new Error(
          `Failed to create Mollie payment: ${(errBody as any).error ?? mollieRes.status}`,
        )
      }

      const { paymentId, checkoutUrl } = (await mollieRes.json()) as {
        paymentId: string
        checkoutUrl: string
      }

      await cl.external_payments.create({
        order: cl.orders.relationship(order.id),
        payment_source_token: paymentId,
      })

      resolveLastLog('done')

      // ── 7. Place / authorize the order ───────────────────────────────────
      setStep('ready')

      if (mode === 'place') {
        // _place: finalizes the order and triggers authorization in one shot.
        addLog('Placing order with _place…')
        await cl.orders.update({ id: order.id, _place: true })
      } else {
        // _authorize: triggers authorization only.
        // Requires the payment method to have auto_place: true in CL dashboard
        // so that a successful (async) authorization also places the order.
        addLog('Authorizing order with _authorize (auto_place)…')
        await cl.orders.update({ id: order.id, _authorize: true })
      }

      resolveLastLog('done')
      addLog('Redirecting to Mollie checkout…')

      await sleep(400)

      window.location.href = checkoutUrl
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      resolveLastLog('error')
      setErrorMsg(msg)
      setStep('error')
    }
  }

  const isRunning = step !== 'idle' && step !== 'ready' && step !== 'error'

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>🛒 Commerce Layer — External Gateway Demo</div>
        <h1 style={styles.h1}>Async Payment Flow</h1>
        <p style={styles.subtitle}>
          Build a complete order automatically and experience the async authorization flow with
          Mollie. Choose how to trigger the authorization:
        </p>

        <div style={styles.scenarioGrid}>
          <div style={styles.scenarioCard}>
            <div style={styles.scenarioTitle}>
              <code style={styles.code}>_place</code>
            </div>
            <p style={styles.scenarioDesc}>
              Finalizes the order and triggers authorization in a single call. The standard
              checkout flow.
            </p>
            {step === 'idle' && (
              <button style={styles.btn} onClick={() => handleStart('place')}>
                Checkout with _place
              </button>
            )}
          </div>

          <div style={styles.scenarioCard}>
            <div style={styles.scenarioTitle}>
              <code style={styles.code}>_authorize</code>
            </div>
            <p style={styles.scenarioDesc}>
              Triggers authorization only. Requires <strong>auto_place: true</strong> on the
              payment method — the order is placed automatically on success.
            </p>
            {step === 'idle' && (
              <button style={{ ...styles.btn, background: '#7c3aed' }} onClick={() => handleStart('authorize')}>
                Checkout with _authorize
              </button>
            )}
          </div>
        </div>

        {isRunning && (
          <div style={styles.runningBanner}>
            ⏳ {STEP_LABELS[step]}
          </div>
        )}

        {logs.length > 0 && (
          <div style={styles.logBox}>
            {logs.map((log, i) => (
              <div key={i} style={styles.logRow}>
                <span style={styles.logIcon}>
                  {log.status === 'pending' ? '⏳' : log.status === 'done' ? '✅' : '❌'}
                </span>
                <span style={{ color: log.status === 'error' ? '#c53030' : '#333' }}>
                  {log.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {step === 'error' && errorMsg && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {step === 'error' && (
          <button
            style={{ ...styles.btn, marginTop: '1rem', background: '#555' }}
            onClick={() => {
              setStep('idle')
              setLogs([])
              setErrorMsg('')
            }}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    background: '#f0f2f5',
  } as React.CSSProperties,

  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '640px',
  } as React.CSSProperties,

  badge: {
    display: 'inline-block',
    background: '#e8f4fd',
    color: '#0369a1',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '0.25rem 0.6rem',
    marginBottom: '1.25rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,

  h1: {
    fontSize: '1.6rem',
    marginBottom: '0.6rem',
    color: '#111',
  } as React.CSSProperties,

  subtitle: {
    color: '#555',
    fontSize: '0.92rem',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  } as React.CSSProperties,

  scenarioGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,

  scenarioCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  } as React.CSSProperties,

  scenarioTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#111',
  } as React.CSSProperties,

  scenarioDesc: {
    fontSize: '0.82rem',
    color: '#555',
    lineHeight: 1.55,
    flexGrow: 1,
  } as React.CSSProperties,

  runningBanner: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    color: '#0369a1',
    marginBottom: '1rem',
  } as React.CSSProperties,

  btn: {
    width: '100%',
    padding: '0.75rem',
    background: '#0070f3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,

  logBox: {
    marginTop: '1.5rem',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  } as React.CSSProperties,

  logRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontSize: '0.88rem',
  } as React.CSSProperties,

  logIcon: {
    fontSize: '0.9rem',
    flexShrink: 0,
  } as React.CSSProperties,

  errorBox: {
    marginTop: '1.25rem',
    background: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: '8px',
    padding: '1rem',
    fontSize: '0.88rem',
    color: '#c53030',
    lineHeight: 1.5,
  } as React.CSSProperties,

  code: {
    fontFamily: 'monospace',
    background: '#e2e8f0',
    borderRadius: '4px',
    padding: '0.1rem 0.35rem',
    fontSize: '0.95rem',
  } as React.CSSProperties,
} as const
