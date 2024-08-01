import { jwtDecode } from "@commercelayer/js-auth"

const accessToken = "exampleJWtT0keNAiO..."

// Decode JWT token
const decoded = jwtDecode(accessToken)
console.log(decoded)

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
      payload: {
        organization: { slug, enterprise },
        application: { id, kind },
        test
      }
    } = jwtDecode(accessToken)

    return { slug, isEnterprise: enterprise, appId: id, kind, isTest: test }
  } catch (error) {
    console.log(`Error decoding access token: ${error}`)
    return {}
  }
}

getTokenInfo(accessToken)
