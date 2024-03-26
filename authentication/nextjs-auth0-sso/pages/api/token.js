import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { ManagementClient } from 'auth0';
import { authenticate, createAssertion } from '@commercelayer/js-auth';

export default withApiAuthRequired(async function token(req, res) {
  try {
    const session = await getSession(req, res);

    const managementClient = new ManagementClient({
      domain: process.env.AUTH0_ISSUER_DOMAIN,
      clientId: process.env.AUTH0_M2M_CLIENT_ID,
      clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
      scope: 'read:users'
    });

    const { data: user } = await managementClient.users.get({
      id: session.user.sub
    });

    const token = await authenticate(
      'urn:ietf:params:oauth:grant-type:jwt-bearer',
      {
        clientId: process.env.CL_SALES_CHANNEL_CLIENT_ID,
        clientSecret: process.env.CL_SALES_CHANNEL_SECRET,
        scope: process.env.NEXT_PUBLIC_CL_MARKET,
        assertion: await createAssertion({
          payload: {
            'https://commercelayer.io/claims': {
              owner: {
                type: 'Customer',
                id: user.user_metadata.customerId
              }
            }
          }
        }),
        headers: {
          'x-backend-auth': process.env.CL_BACKEND_AUTH_KEY,
          'x-true-client-ip': req.socket?.remoteAddress
        }
      }
    );

    res.status(200).json({
      accessToken: token.accessToken,
      expires: token.expires
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});
