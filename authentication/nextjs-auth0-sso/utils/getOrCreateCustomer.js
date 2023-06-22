import { ManagementClient } from 'auth0';
import getClient from './getIntegration';

export default async function getOrCreateCustomer(user) {
  const auth0UserId = user.sub;
  const client = await getClient();
  const customer = await client.customers.list({ filters: { email_eq: user.email } });
  let customerId;

  if (customer.length > 0) {
    console.log('User already exists, syncing ID on Auth0');
    customerId = customer[0].id;
  } else {
    console.log(`Creating customer ${user.name}`);
    const newCustomer = await client.customers.create({
      email: user.email,
      password: Math.random().toString(36).slice(-8)
    });
    customerId = newCustomer.id;
  }

  const currentUserManagementClient = new ManagementClient({
    domain: process.env.AUTH0_ISSUER_DOMAIN,
    clientId: process.env.AUTH0_M2M_CLIENT_ID,
    clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
    scope: 'update:users'
  });

  try {
    await currentUserManagementClient.updateUserMetadata({ id: auth0UserId }, { customerId });
  } catch (error) {
    console.error('Error on updating the user metadata:', error);
    throw error;
  }
}
