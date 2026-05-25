import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getCLClient } from '../lib/cl'

type PaymentStatus =
  | 'unknown'
  | 'unpaid'
  | 'authorized'
  | 'paid'
  | 'voided'
  | 'refunded'
  | 'free'
  | 'error'

type OrderStatus = 'draft' | 'pending' | 'placed' | 'approved' | 'cancelled'

interface StatusSnapshot {
  time: string
  orderStatus: OrderStatus | string
  paymentStatus: PaymentStatus | string
  note: string
}

const POLL_INTERVAL_MS = 1_500
const MAX_POLLS = 40 // 60 seconds max

export function ReturnPage() {
  const [params] = useSearchParams()
  const orderId = params.get('order_id')

  const [history, setHistory] = useState<StatusSnapshot[]>([])
  const [polling, setPolling] = useState(false)
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const pollCount = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function addSnapshot(snap: StatusSnapshot) {
    setHistory((prev) => {
      // Only add if status changed from last snapshot
      const last = prev[prev.length - 1]
      if (last?.paymentStatus === snap.paymentStatus && last?.orderStatus === snap.orderStatus) {
        return prev
      }
      return [...prev, snap]
    })
  }

  async function pollOrder() {
    if (!orderId) return
    pollCount.current += 1

    try {
      const cl = await getCLClient()
      const order = await cl.orders.retrieve(orderId, {
        fields: { orders: ['status', 'payment_status', 'number'] },
      })

      const snap: StatusSnapshot = {
        time: new Date().toLocaleTimeString(),
        orderStatus: (order.status as string) ?? 'unknown',
        paymentStatus: (order.payment_status as string) ?? 'unknown',
        note: deriveNote(order.status as string, order.payment_status as string),
      }

      addSnapshot(snap)

      const isSettled =
        order.payment_status === 'authorized' ||
        order.payment_status === 'paid' ||
        order.payment_status === 'voided' ||
        order.payment_status === 'refunded' ||
        order.payment_status === 'free'

      if (isSettled || pollCount.current >= MAX_POLLS) {
        stopPolling()
        setDone(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg)
      stopPolling()
    }
  }

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setPolling(false)
  }

  useEffect(() => {
    if (!orderId) return
    setPolling(true)
    pollOrder() // immediate first poll
    intervalRef.current = setInterval(pollOrder, POLL_INTERVAL_MS)
    return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  if (!orderId) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>Missing order ID</h1>
          <p>
            <Link to="/">← Back to checkout</Link>
          </p>
        </div>
      </div>
    )
  }

  const latestPaymentStatus = history[history.length - 1]?.paymentStatus ?? 'unknown'
  const isAuthorized = latestPaymentStatus === 'authorized' || latestPaymentStatus === 'paid'

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>🔄 Async Payment Status</div>

        <h1 style={styles.h1}>
          {done && isAuthorized
            ? '✅ Payment authorized!'
            : done
              ? '⚠️ Payment finished (check status)'
              : '⏳ Waiting for authorization…'}
        </h1>

        <p style={styles.subtitle}>
          Order <code style={styles.code}>{orderId}</code>
          <br />
          The order was placed with an async authorization. Mollie is calling Commerce
          Layer's webhook once the payment is confirmed.
        </p>

        {/* Live status badge */}
        <div style={styles.statusRow}>
          <StatusBadge label="Order status" value={history[history.length - 1]?.orderStatus} />
          <StatusBadge
            label="Payment status"
            value={latestPaymentStatus}
            highlight={isAuthorized}
          />
        </div>

        {/* Timeline */}
        {history.length > 0 && (
          <div style={styles.timeline}>
            <div style={styles.timelineTitle}>Status timeline</div>
            {history.map((snap, i) => (
              <div key={i} style={styles.timelineRow}>
                <span style={styles.timelineTime}>{snap.time}</span>
                <div style={styles.timelineContent}>
                  <span style={styles.timelineNote}>{snap.note}</span>
                  <span style={styles.timelineDetail}>
                    order: <strong>{snap.orderStatus}</strong> · payment:{' '}
                    <strong>{snap.paymentStatus}</strong>
                  </span>
                </div>
              </div>
            ))}
            {polling && (
              <div style={{ ...styles.timelineRow, opacity: 0.5 }}>
                <span style={styles.timelineTime}>…</span>
                <div style={styles.timelineContent}>
                  <span style={styles.timelineNote}>Polling for changes</span>
                </div>
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div style={styles.errorBox}>
            <strong>Polling error:</strong> {errorMsg}
          </div>
        )}

        {done && (
          <Link to="/" style={styles.backLink}>
            ← Start a new checkout
          </Link>
        )}
      </div>
    </div>
  )
}

function StatusBadge({
  label,
  value,
  highlight,
}: {
  label: string
  value?: string
  highlight?: boolean
}) {
  const color = highlight ? '#15803d' : value === 'unknown' || !value ? '#6b7280' : '#1e40af'
  const bg = highlight ? '#dcfce7' : value === 'unknown' || !value ? '#f3f4f6' : '#dbeafe'

  return (
    <div style={styles.badgeBox}>
      <span style={styles.badgeLabel}>{label}</span>
      <span style={{ ...styles.badgeValue, background: bg, color }}>{value ?? '…'}</span>
    </div>
  )
}

function deriveNote(orderStatus: string, paymentStatus: string): string {
  if (paymentStatus === 'authorized') return '🎉 Authorization confirmed by Commerce Layer webhook'
  if (paymentStatus === 'paid') return '💳 Payment captured'
  if (orderStatus === 'placed' && paymentStatus === 'unpaid')
    return '⏳ Order placed — async authorization pending'
  if (orderStatus === 'placed') return '📋 Order placed'
  return `Order: ${orderStatus} / Payment: ${paymentStatus}`
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '2rem 1.5rem',
    background: '#f0f2f5',
  } as React.CSSProperties,

  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '560px',
  } as React.CSSProperties,

  badge: {
    display: 'inline-block',
    background: '#fef9c3',
    color: '#854d0e',
    border: '1px solid #fde68a',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '0.25rem 0.6rem',
    marginBottom: '1.25rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,

  h1: {
    fontSize: '1.4rem',
    marginBottom: '0.75rem',
    color: '#111',
  } as React.CSSProperties,

  subtitle: {
    color: '#555',
    fontSize: '0.88rem',
    lineHeight: 1.65,
    marginBottom: '1.5rem',
  } as React.CSSProperties,

  code: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '0.1rem 0.4rem',
    fontFamily: 'monospace',
    fontSize: '0.82rem',
  } as React.CSSProperties,

  statusRow: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  badgeBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  } as React.CSSProperties,

  badgeLabel: {
    fontSize: '0.72rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#6b7280',
    fontWeight: 600,
  } as React.CSSProperties,

  badgeValue: {
    fontSize: '0.85rem',
    fontWeight: 700,
    padding: '0.3rem 0.7rem',
    borderRadius: '20px',
  } as React.CSSProperties,

  timeline: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  } as React.CSSProperties,

  timelineTitle: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    padding: '0.6rem 1rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,

  timelineRow: {
    display: 'flex',
    gap: '0.75rem',
    padding: '0.7rem 1rem',
    borderBottom: '1px solid #f1f5f9',
    alignItems: 'flex-start',
  } as React.CSSProperties,

  timelineTime: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontFamily: 'monospace',
    flexShrink: 0,
    paddingTop: '0.1rem',
  } as React.CSSProperties,

  timelineContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.15rem',
  } as React.CSSProperties,

  timelineNote: {
    fontSize: '0.88rem',
    color: '#1e293b',
  } as React.CSSProperties,

  timelineDetail: {
    fontSize: '0.75rem',
    color: '#64748b',
  } as React.CSSProperties,

  errorBox: {
    background: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: '8px',
    padding: '1rem',
    fontSize: '0.88rem',
    color: '#c53030',
    lineHeight: 1.5,
    marginBottom: '1rem',
  } as React.CSSProperties,

  backLink: {
    display: 'inline-block',
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    color: '#0070f3',
  } as React.CSSProperties,
} as const
