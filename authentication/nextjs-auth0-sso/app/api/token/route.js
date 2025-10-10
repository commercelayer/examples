import { auth0 } from '../../../lib/auth0'
import { ManagementClient } from 'auth0'
import { authenticate, createAssertion } from '@commercelayer/js-auth'
import { NextResponse } from 'next/server'

export const GET = async function token(request) {
  try {
    // In v4, getSession() needs the request object in API routes
    const session = await auth0.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const managementClient = new ManagementClient({
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_M2M_CLIENT_ID,
      clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
    })

    // Ensure user.sub is a valid string
    if (!session.user.sub || typeof session.user.sub !== 'string') {
      console.error('Invalid user.sub:', session.user.sub)
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const user = await managementClient.users.get(session.user.sub)

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
                id: user.user_metadata.customerId,
              },
            },
          },
        }),
        headers: {
          'x-backend-auth': process.env.CL_BACKEND_AUTH_KEY,
          'x-true-client-ip': request.socket?.remoteAddress,
        },
      },
    )
    return NextResponse.json(
      {
        token: token,
      },
      { status: 200 },
    )
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 },
    )
  }
}
