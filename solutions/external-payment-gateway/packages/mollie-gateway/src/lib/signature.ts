import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verifies the X-CommerceLayer-Signature header.
 * Commerce Layer signs the raw request body with the gateway shared secret
 * using HMAC-SHA256 and base64-encodes the result.
 *
 * @see https://docs.commercelayer.io/core/external-resources/external-payment-gateways#security
 */
export function verifySignature(rawBody: string, signature: string | undefined): boolean {
  const secret = process.env.CL_GATEWAY_SHARED_SECRET
  if (!secret) {
    console.warn('⚠️  CL_GATEWAY_SHARED_SECRET not set — skipping signature verification')
    return true
  }
  if (!signature) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('base64')

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}
