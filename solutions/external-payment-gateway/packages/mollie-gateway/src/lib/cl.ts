import { CommerceLayer, type CommerceLayerBundle } from '@commercelayer/sdk/bundle'
import { makeIntegration, type Storage, type StorageValue } from '@commercelayer/js-auth'

if (!process.env.CL_CLIENT_ID) throw new Error('Missing CL_CLIENT_ID')
if (!process.env.CL_CLIENT_SECRET) throw new Error('Missing CL_CLIENT_SECRET')

const domain = process.env.CL_DOMAIN ?? 'commercelayer.io'

function memoryStorage(): Storage {
  const store = new Map<string, StorageValue>()
  return {
    name: 'in-memory',
    async getItem(key: string): Promise<StorageValue | null> {
      return store.get(key) ?? null
    },
    async setItem(key: string, value: StorageValue): Promise<void> {
      store.set(key, value)
    },
    async removeItem(key: string): Promise<void> {
      store.delete(key)
    },
  }
}

const integration = makeIntegration(
  {
    clientId: process.env.CL_CLIENT_ID,
    clientSecret: process.env.CL_CLIENT_SECRET,
    domain,
  },
  { storage: memoryStorage() },
)

/**
 * Returns a Commerce Layer SDK client authenticated with a cached integration token.
 * Token caching and refresh are handled automatically by `@commercelayer/js-auth`.
 * The organization slug is inferred automatically from the JWT payload.
 */
export async function getCLClient(): Promise<CommerceLayerBundle> {
  const { accessToken } = await integration.getAuthorization()
  console.log('Obtained CL access token:', accessToken)
  return CommerceLayer({ accessToken, domain })
}
