// Generate an integration app access token

import { authentication } from "@commercelayer/js-auth";

const SLUG = "<organization slug>";
const CLIENT_ID = "<your client id>";
const CLIENT_SECRET = "<your client secret>";

const getToken = async () => {
  if (SLUG && CLIENT_ID && CLIENT_SECRET) {
    const auth = await authentication("client_credentials", {
      slug: SLUG,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    });
    console.log(auth.accessToken);
  }
};

getToken();
