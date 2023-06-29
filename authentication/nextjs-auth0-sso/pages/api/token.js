import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { ManagementClient } from 'auth0';

import jwt from 'jsonwebtoken';

export default withApiAuthRequired(async function token(req, res) {
  try {
    const session = await getSession(req, res);

    const managementClient = new ManagementClient({
      domain: process.env.AUTH0_ISSUER_DOMAIN,
      clientId: process.env.AUTH0_M2M_CLIENT_ID,
      clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
      scope: 'read:users'
    });

    const user = await managementClient.getUser({ id: session.user.sub });

    const payload = {
      organization: {
        id: process.env.NEXT_PUBLIC_CL_ORGANIZATION_ID,
        slug: process.env.NEXT_PUBLIC_CL_ENDPOINT,
        enterprise: true
      },
      application: { id: process.env.NEXT_PUBLIC_CL_SALES_CHANNEL_ID, kind: 'sales_channel', public: true },
      owner: { id: user.user_metadata.customerId, type: 'Customer' },
      test: true,
      market: {
        id: [process.env.NEXT_PUBLIC_CL_MARKET_ID],
        price_list_id: process.env.NEXT_PUBLIC_CL_PRICE_LIST_ID,
        stock_location_ids: JSON.parse(process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_IDS),
        geocoder_id: null,
        allows_external_prices: false
      },
      rand: Math.random()
    };
    const token = jwt.sign(payload, process.env.CL_SHARED_SECRET, {
      algorithm: 'HS512',
      expiresIn: 7200
    });

    res.status(200).json({ accessToken: token, expires: Date.now() + 7200 * 1000 });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});
