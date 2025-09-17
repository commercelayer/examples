import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { NextResponse } from 'next/server'

import getOrCreateCustomer from '../utils/getOrCreateCustomer'

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  authorizationParameters: {
    scope: 'openid profile email',
  },
  // Enable session rolling to handle old sessions gracefully
  session: {
    rolling: true,
    rollingDuration: 24 * 60 * 60, // 24 hours
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
