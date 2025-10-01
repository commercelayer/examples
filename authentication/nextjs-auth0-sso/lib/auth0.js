import { Auth0Client } from '@auth0/nextjs-auth0/server'
import getOrCreateCustomer from '../utils/getOrCreateCustomer'
import { NextResponse } from 'next/server'

// Initialize the Auth0 client
export const auth0 = new Auth0Client({
  // Options are loaded from environment variables by default
  // Ensure necessary environment variables are properly set
  // domain: process.env.AUTH0_DOMAIN,
  // clientId: process.env.AUTH0_CLIENT_ID,
  // clientSecret: process.env.AUTH0_CLIENT_SECRET,
  // appBaseUrl: process.env.APP_BASE_URL,
  // secret: process.env.AUTH0_SECRET,
  authorizationParameters: {
    // In v4, the AUTH0_SCOPE and AUTH0_AUDIENCE environment variables are no longer automatically picked up by the SDK.
    // Instead, we need to provide the values explicitly.
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  },
  // onCallback hook replaces the afterCallback logic from v3
  async onCallback(error, context, session) {
    if (error) {
      console.error('Authentication error:', error)
      return NextResponse.redirect(new URL('/error', process.env.APP_BASE_URL))
    }

    // Custom logic after successful authentication - preserving your original afterCallback
    if (session?.user) {
      try {
        await getOrCreateCustomer(session.user)
      } catch (customerError) {
        console.error('Error creating/getting customer:', customerError)
        // Continue with authentication even if customer creation fails
      }
    }

    // Redirect to the return URL or default to home
    return NextResponse.redirect(
      new URL(context.returnTo || '/', process.env.APP_BASE_URL),
    )
  },
})
