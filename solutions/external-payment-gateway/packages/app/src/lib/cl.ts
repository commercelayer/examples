import { CommerceLayer, type CommerceLayerBundle } from '@commercelayer/sdk/bundle'
import { makeSalesChannel, type Storage, type StorageValue } from '@commercelayer/js-auth'

const clientId = import.meta.env.VITE_CL_CLIENT_ID as string
const domain = (import.meta.env.VITE_CL_DOMAIN as string | undefined) ?? 'commercelayer.io'
const marketScope = import.meta.env.VITE_CL_MARKET_SCOPE as string

if (!clientId) throw new Error('Missing VITE_CL_CLIENT_ID')
if (!marketScope) throw new Error('Missing VITE_CL_MARKET_SCOPE')

function localStorageStore(): Storage {
  return {
    name: 'localStorage',
    async getItem(key: string): Promise<StorageValue | null> {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as StorageValue) : null
    },
    async setItem(key: string, value: StorageValue): Promise<void> {
      localStorage.setItem(key, JSON.stringify(value))
    },
    async removeItem(key: string): Promise<void> {
      localStorage.removeItem(key)
    },
  }
}

const salesChannel = makeSalesChannel(
  {
    clientId,
    scope: marketScope,
    domain,
  },
  { storage: localStorageStore() },
)

/**
 * Returns a Commerce Layer SDK client authenticated with a cached sales channel token.
 * Token caching and refresh are handled automatically by `@commercelayer/js-auth`.
 * The organization slug is inferred automatically from the JWT payload.
 */
export async function getCLClient(): Promise<CommerceLayerBundle> {
  const { accessToken } = await salesChannel.getAuthorization()
  return CommerceLayer({ accessToken, domain })
}

export const CL_SKU_CODE = import.meta.env.VITE_CL_SKU_CODE as string
export const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL as string
