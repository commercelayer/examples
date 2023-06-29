import Cookies from "js-cookie";
import { authentication } from "@commercelayer/js-auth";

const SLUG = "<organization slug>";
const CLIENT_ID = "<your client id>";
const CLIENT_SECRET = "<your client secret>";

const getToken = async () => {
  let token = "";
  const getCookieToken = Cookies.get("clIntegrationToken");
  if (!getCookieToken && CLIENT_ID && CLIENT_SECRET && SLUG) {
    const auth = await authentication("client_credentials", {
      slug: SLUG,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    });
    token = auth.accessToken;
    Cookies.set("clIntegrationToken", token, {
      expires: auth.expires,
    });
  } else {
    token = getCookieToken || "";
  }
  return token;
};

// getToken();
