import { authenticate } from '@commercelayer/js-auth';
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
  const token = await authenticate('client_credentials', {
    clientId: process.env.CL_INTEGRATION_CLIENT_ID,
    clientSecret: process.env.CL_INTEGRATION_SECRET
  });
  return token.accessToken;
}
