import jwt_decode from "jwt-decode";

const accessToken = "exampleJWtT0keNAiO...";

// Decode JWT token
const decoded = jwt_decode(accessToken);
console.log(decoded);

// Will return:
// {
//   organization: Object,
//   application: Object,
//   test: Boolean,
//   exp: Number,
//   rand: Number
// }

// "organization" includes id, slug, and enterprise.
// "application" includes id, kind, and public.

// Decode JWT token and return specific values
const getTokenInfo = async () => {
  try {
    const {
      organization: { slug, enterprise },
      application: { id, kind },
      test,
    } = jwt_decode(accessToken);

    return { slug, isEnterprise: enterprise, appId: id, kind, isTest: test };
  } catch (error) {
    console.log(`Error decoding access token: ${error}`);
    return {};
  }
};

getTokenInfo(accessToken);
