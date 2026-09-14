import * as dotenv from "dotenv";
dotenv.config();

import { authenticate, jwtDecode } from "@commercelayer/js-auth";
import { ConfigOptions } from "../types/config";

export const getToken = async () => {
  const auth = await authenticate("client_credentials", {
    clientId: process.env.CL_CLIENT_ID,
    clientSecret: process.env.CL_CLIENT_SECRET
  });
  return auth.accessToken;
};

// The organization the token was issued for, its environment and its expiration
// are all claims of the token itself, so none of them needs to be stored alongside it.
export const getTokenInfo = async (accessToken) => {
  try {
    const { payload } = jwtDecode(accessToken);

    return {
      isTest: payload.test,
      organizationSlug: "organization" in payload ? payload.organization.slug : undefined,
      expiresAt: new Date(payload.exp * 1000)
    };
  } catch (error) {
    console.log(`Error decoding access token: ${error}`);
    return { isTest: undefined, organizationSlug: undefined, expiresAt: undefined };
  }
};

export const getCheckoutToken = async (config: ConfigOptions, marketNumber: number) => {
  const { clientIdCheckout } = config;
  const auth = await authenticate("client_credentials", {
    clientId: clientIdCheckout,
    scope: `market:${marketNumber}`
  });
  return auth.accessToken;
};
