// Generate a sales_channel app access token

import { authentication } from "@commercelayer/js-auth";

const SLUG = "<organization slug>";
const CLIENT_ID = "<your client id>";
const SCOPE = "<your market scope>";

const getToken = async () => {
  if (SLUG && CLIENT_ID && SCOPE) {
    const auth = await authentication("client_credentials", {
      slug: SLUG,
      clientId: CLIENT_ID,
      scope: SCOPE,
    });
    console.log(auth.accessToken);
  }
};

getToken();
