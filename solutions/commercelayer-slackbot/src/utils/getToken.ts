import * as dotenv from "dotenv";
dotenv.config();

import jwt_decode from "jwt-decode";
import { authentication } from "@commercelayer/js-auth";
import { getSlug } from "./parseText";
import { ConfigOptions } from "../types/config";

interface JWTProps {
  test: boolean;
}

export const getToken = async () => {
  const auth = await authentication("client_credentials", {
    clientId: process.env.CL_CLIENT_ID,
    clientSecret: process.env.CL_CLIENT_SECRET,
    slug: getSlug(process.env.CL_ENDPOINT)
  });
  return auth.accessToken;
};

export const getTokenInfo = async (accessToken) => {
  try {
    const { test } = jwt_decode(accessToken) as JWTProps;

    return { isTest: test };
  } catch (error) {
    console.log(`Error decoding access token: ${error}`);
    return {};
  }
};

export const getCheckoutToken = async (config: ConfigOptions, marketNumber: number) => {
  const { organizationSlug, clientIdCheckout } = config;
  const auth = await authentication("client_credentials", {
    slug: organizationSlug,
    clientId: clientIdCheckout,
    scope: `market:${marketNumber}`
  });
  return auth.accessToken;
};
