import Cookies from "js-cookie"
import { authenticate } from "@commercelayer/js-auth"

const CLIENT_ID = "<your client id>"
const SCOPE = "<your market scope>"

const getToken = async () => {
  let token = ""
  const getCookieToken = Cookies.get("clSalesChannelToken")
  if (!getCookieToken && CLIENT_ID && SCOPE) {
    const auth = await authenticate("client_credentials", {
      clientId: CLIENT_ID,
      scope: SCOPE
    })
    token = auth.accessToken
    Cookies.set("clSalesChannelToken", token, {
      expires: auth.expires
    })
  } else {
    token = getCookieToken || ""
  }
  return token
}

// getToken();
