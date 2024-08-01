// Generate an integration app access token

import { authenticate } from "@commercelayer/js-auth"

const CLIENT_ID = "<your client id>"
const CLIENT_SECRET = "<your client secret>"

const getToken = async () => {
  if (CLIENT_ID && CLIENT_SECRET) {
    const auth = await authenticate("client_credentials", {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    })
    console.log(auth.accessToken)
  }
}

getToken()
