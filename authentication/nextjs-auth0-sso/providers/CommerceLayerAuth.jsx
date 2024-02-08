import React, { createContext, useContext, useEffect, useState } from 'react';
import { authentication } from '@commercelayer/js-auth';
import jwt from 'jsonwebtoken';
import { useUser } from '@auth0/nextjs-auth0/client';

const CommerceLayerAuthContext = createContext();

const getAuth = (kind) => {
  if (kind === 'sales') {
    localStorage.removeItem(getStoreKey('customer'));
  }
  const storeKey = getStoreKey(kind);
  return JSON.parse(localStorage.getItem(storeKey) || 'null');
};

const storeAuth = (kind, authReturn) => {
  if (!authReturn) {
    return null;
  }

  const storeKey = getStoreKey(kind);

  const auth = {
    accessToken: authReturn.accessToken,
    expires: authReturn.expires?.getTime()
  };

  localStorage.setItem(storeKey, JSON.stringify(auth));

  return auth;
};

const getStoreKey = (customer) => `clayer_token:${customer}`;

const hasExpired = (time) => time === undefined || time < Date.now();
const isValid = (auth) => !hasExpired(auth?.expires);

export const CommerceLayerAuthProvider = ({ children }) => {
  const { user, isLoading } = useUser();
  const [auth, setAuth] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    async function fetchToken() {
      if (!isLoading) {
        if (user) {
          const auth = getAuth('customer');
          if (isValid(auth)) {
            console.log('Get customer token from local storage');
            setAuth(auth);
          } else {
            console.log('Get customer token from /api/token');

            const response = await fetch('api/token').then((response) =>
              response.json()
            );

            setAuth(
              storeAuth('customer', {
                ...response,
                expires: new Date(response.expires)
              })
            );
          }
        } else {
          const auth = getAuth('sales');
          if (isValid(auth)) {
            console.log('Get sales token from local storage');
            setAuth(auth);
          } else {
            console.log('Get sales token with js-auth');
            const salesChannelToken = await authentication(
              'client_credentials',
              {
                clientId: process.env.NEXT_PUBLIC_CL_SALES_CHANNEL_CLIENT_ID,
                scope: process.env.NEXT_PUBLIC_CL_MARKET,
                slug: process.env.NEXT_PUBLIC_CL_ENDPOINT
              }
            );

            const token = salesChannelToken.accessToken;
            const payload = jwt.decode(token);
            console.log(
              'You need to add those values on your .env.local file:'
            );
            console.log(
              `NEXT_PUBLIC_CL_ORGANIZATION_ID=${payload.organization.id}`
            );
            console.log(
              `NEXT_PUBLIC_CL_SALES_CHANNEL_ID=${payload.application.id}`
            );
            console.log(
              `NEXT_PUBLIC_CL_PRICE_LIST_ID=${payload.market.price_list_id}`
            );
            console.log(
              `NEXT_PUBLIC_CL_STOCK_LOCATION_IDS=${JSON.stringify(payload.market.stock_location_ids)}`
            );
            if (token) {
              setAuth(storeAuth('sales', salesChannelToken));
            }
          }
        }
        setIsLoadingAuth(false);
      } else {
        setIsLoadingAuth(true);
      }
    }
    fetchToken();
  }, [user, isLoading]);

  return (
    <CommerceLayerAuthContext.Provider
      value={{ auth, isLoading: isLoadingAuth }}
    >
      {children}
    </CommerceLayerAuthContext.Provider>
  );
};

export const useCommerceLayerAuth = () => useContext(CommerceLayerAuthContext);
