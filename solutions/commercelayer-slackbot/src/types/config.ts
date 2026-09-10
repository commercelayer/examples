import { CommerceLayerClient } from "@commercelayer/sdk";

export interface ConfigOptions {
  cl: CommerceLayerClient;
  organizationMode: string;
  organizationSlug: string;
  clientIdApp: string;
  clientIdCheckout: string;
  isTokenExpired: boolean;
}
