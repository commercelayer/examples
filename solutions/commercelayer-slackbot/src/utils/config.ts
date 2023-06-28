import * as dotenv from "dotenv";
dotenv.config();

import CommerceLayer from "@commercelayer/sdk";
import { database } from "../database/supabaseClient";
import { getToken } from "./getToken";
import { getSlug } from "./parseText";

const appMode = process.env.APPLICATION_MODE;
const isProd = appMode === "production";

export const initConfig = async (slackId: string) => {
  const { data, error } = await database
    .from("users")
    .select("cl_app_credentials")
    .eq("slack_id", slackId);
  if (error) {
    throw error;
  }
  const clUserCredentials = data[0].cl_app_credentials;

  // Variables for all required credentials.
  const baseEndpoint = isProd ? clUserCredentials.endpoint : process.env.CL_ENDPOINT;
  const organizationMode = isProd ? clUserCredentials.mode : process.env.CL_ORGANIZATION_MODE;
  const organizationSlug = getSlug(baseEndpoint);
  const clientIdApp = isProd ? clUserCredentials.clientIdApp : process.env.CL_CLIENT_ID;
  const clientIdCheckout = isProd
    ? clUserCredentials.clientIdCheckout
    : process.env.CL_CLIENT_ID_CHECKOUT;
  const clAccessToken = isProd ? clUserCredentials.accessToken.token : await getToken();

  const cl = CommerceLayer({
    organization: organizationSlug,
    accessToken: clAccessToken
  });

  return {
    cl,
    organizationMode,
    organizationSlug,
    baseEndpoint,
    clientIdApp,
    clientIdCheckout
  };
};
