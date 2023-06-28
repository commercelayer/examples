import Cookies from "js-cookie";
import { authentication } from "@commercelayer/js-auth";

const SLUG = "<organization slug>";
const CLIENT_ID = "<your client id>";
const SCOPE = "<your market scope>";

const getToken = async () => {
  let token = "";
  const getCookieToken = Cookies.get("clSalesChannelToken");
  if (!getCookieToken && CLIENT_ID && SLUG && SCOPE) {
    const auth = await authentication("client_credentials", {
      slug: SLUG,
      clientId: CLIENT_ID,
      scope: SCOPE,
    });
    token = auth.accessToken;
    Cookies.set("clSalesChannelToken", token, {
      expires: auth.expires,
    });
  } else {
    token = getCookieToken || "";
  }
  return token;
};

// getToken();
