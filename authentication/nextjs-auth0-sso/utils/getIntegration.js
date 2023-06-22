import { getIntegrationToken } from '@commercelayer/js-auth';
import { CommerceLayer } from '@commercelayer/sdk';

export default async function getClient() {
  const token = await getIntegration();
  const client = CommerceLayer({
    accessToken: token,
    organization: process.env.NEXT_PUBLIC_CL_ENDPOINT
  });
  return client;
}

async function getIntegration() {
  const token = await getIntegrationToken({
    endpoint: `https://${process.env.NEXT_PUBLIC_CL_ENDPOINT}.commercelayer.io`,
    clientId: process.env.CL_INTEGRATION_CLIENT_ID,
    clientSecret: process.env.CL_INTEGRATION_SECRET
  });
  return token.accessToken;
}
