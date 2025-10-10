import { jwtDecode, makeIntegration } from '@commercelayer/js-auth'
import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import { CommerceLayer } from '@commercelayer/sdk'

const memoryStorage = createStorage({
  driver: memoryDriver(),
})

const integration = makeIntegration(
  {
    clientId: process.env.CL_INTEGRATION_CLIENT_ID,
    clientSecret: process.env.CL_INTEGRATION_SECRET,
    debug: true,
  },
  {
    storage: memoryStorage,
  },
)

export default async function getClient() {
  const token = await integration.getAuthorization()
  const { payload } = jwtDecode(token.accessToken)
  const client = CommerceLayer({
    accessToken: token.accessToken,
    organization: payload.organization.slug,
  })
  return client
}
