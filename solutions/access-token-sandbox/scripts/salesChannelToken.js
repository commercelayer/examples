// Generate a sales_channel app access token

import { authenticate } from "@commercelayer/js-auth"

const CLIENT_ID = "<your client id>"
const SCOPE = "<your market scope>"

const getToken = async () => {
  if (CLIENT_ID && SCOPE) {
    const auth = await authenticate("client_credentials", {
      clientId: CLIENT_ID,
      scope: SCOPE
    })
    console.log(auth.accessToken)
  }
}

getToken()
