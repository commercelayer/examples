import Cookies from "js-cookie"
import { authenticate } from "@commercelayer/js-auth"

const CLIENT_ID = "<your client id>"
const CLIENT_SECRET = "<your client secret>"

const getToken = async () => {
  let token = ""
  const getCookieToken = Cookies.get("clIntegrationToken")
  if (!getCookieToken && CLIENT_ID && CLIENT_SECRET) {
    const auth = await authenticate("client_credentials", {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    })
    token = auth.accessToken
    Cookies.set("clIntegrationToken", token, {
      expires: auth.expires
    })
  } else {
    token = getCookieToken || ""
  }
  return token
}

// getToken();
