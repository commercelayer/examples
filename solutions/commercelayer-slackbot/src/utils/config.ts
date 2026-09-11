import * as dotenv from "dotenv";
dotenv.config();

import CommerceLayer from "@commercelayer/sdk";
import { database } from "../database/supabaseClient";
import { getToken, getTokenInfo } from "./getToken";

const appMode = process.env.APP_MODE;
const isProd = appMode === "production";

// Treat a token that is about to expire as already expired, so that it cannot
// lapse midway through a request.
const EXPIRATION_MARGIN_MS = 60 * 1000;

// In production each Slack workspace is bound to its own organization, so the
// credentials are read from the database. In development they come from .env,
// and the database is never queried.
const getCredentials = async (slackId: string) => {
  if (!isProd) {
    return {
      clientIdApp: process.env.CL_CLIENT_ID,
      clientIdCheckout: process.env.CL_CLIENT_ID_CHECKOUT,
      clAccessToken: await getToken()
    };
  }

  const { data, error } = await database
    .from("users")
    .select("cl_app_credentials")
    .eq("slack_id", slackId);
  if (error) {
    throw error;
  }
  const clUserCredentials = data[0].cl_app_credentials;

  return {
    clientIdApp: clUserCredentials.clientIdApp,
    clientIdCheckout: clUserCredentials.clientIdCheckout,
    clAccessToken: clUserCredentials.accessToken.token
  };
};

export const initConfig = async (slackId: string) => {
  const { clientIdApp, clientIdCheckout, clAccessToken } = await getCredentials(slackId);

  // The organization, its environment and the token expiration are all claims of
  // the access token, so none of them needs to be stored or configured separately.
  const { isTest, organizationSlug, expiresAt } = await getTokenInfo(clAccessToken);
  const organizationMode = isTest ? "test" : "live";

  // In production the token is minted once, when the app credentials are submitted,
  // and cannot be renewed automatically because the client secret is deliberately
  // not stored. Detect the expiration up front so the failure can be reported as
  // such, instead of surfacing as a 401 on every subsequent API call.
  const isTokenExpired =
    expiresAt === undefined || expiresAt.getTime() - EXPIRATION_MARGIN_MS <= Date.now();

  const cl = CommerceLayer({
    organization: organizationSlug,
    accessToken: clAccessToken
  });

  return {
    cl,
    organizationMode,
    organizationSlug,
    clientIdApp,
    clientIdCheckout,
    isTokenExpired
  };
};
