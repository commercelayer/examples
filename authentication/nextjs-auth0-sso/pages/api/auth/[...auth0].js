import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';

import getOrCreateCustomer from '../../../utils/getOrCreateCustomer';

export default handleAuth({
  async callback(req, res) {
    try {
      await handleCallback(req, res, { afterCallback });
    } catch (error) {
      res.status(error.status || 500).end();
    }
  }
});

const afterCallback = async (req, res, session, state) => {
  await getOrCreateCustomer(session.user);
  return session;
};
