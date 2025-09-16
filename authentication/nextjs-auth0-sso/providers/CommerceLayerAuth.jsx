import { createContext, useContext, useEffect, useState } from 'react'
import { makeSalesChannel, jwtDecode } from '@commercelayer/js-auth'
import { useUser } from '@auth0/nextjs-auth0/client'
import { createStorage } from 'unstorage'
import localStorageDriver from 'unstorage/drivers/localstorage'

const CommerceLayerAuthContext = createContext()

export const CommerceLayerAuthProvider = ({ children }) => {
  const { user, isLoading } = useUser()
  const [auth, setAuth] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [salesChannel, setSalesChannel] = useState(null)

  useEffect(() => {
    async function fetchToken() {
      const storage = createStorage({
        driver: localStorageDriver({ base: 'auth0_sample:' }),
      })

      const salesChannel = makeSalesChannel(
        {
          clientId: process.env.NEXT_PUBLIC_CL_SALES_CHANNEL_CLIENT_ID,
          scope: process.env.NEXT_PUBLIC_CL_MARKET,
        },
        {
          storage,
        },
      )
      setSalesChannel(salesChannel)
    }

    fetchToken()
  }, [])

  useEffect(() => {
    async function fetchToken() {
      if (!isLoading) {
        const tokenData = await salesChannel.getAuthorization()

        if (user) {
          if (tokenData.ownerType === 'customer') {
            console.log('Set customer token from local storage', tokenData)
            setAuth(tokenData)
          } else {
            console.log('Get customer token from /api/token')

            const response = await fetch('api/token').then((response) =>
              response.json(),
            )

            await salesChannel.setCustomer({
              accessToken: response.token.accessToken,
              scope: tokenData.scope,
            })

            setAuth({
              accessToken: response.token.accessToken,
              expires: new Date(response.token.expires),
            })
          }
        } else {
          if (tokenData) {
            console.log('Get sales channel token from local storage', tokenData)
            setAuth({
              accessToken: tokenData.accessToken,
              expires: tokenData.expires,
            })
          }
        }
        setIsLoadingAuth(false)
      } else {
        setIsLoadingAuth(true)
      }
    }
    fetchToken()
  }, [user, isLoading])

  const logout = async () => {
    await salesChannel.logoutCustomer()
    window.location.href = '/api/auth/logout'
  }

  return (
    <CommerceLayerAuthContext.Provider
      value={{ auth, logout, isLoading: isLoadingAuth }}
    >
      {children}
    </CommerceLayerAuthContext.Provider>
  )
}

export const useCommerceLayerAuth = () => useContext(CommerceLayerAuthContext)
