import { Auth0Provider } from '@auth0/nextjs-auth0'

import Layout from '../components/Layout'

import '@fortawesome/fontawesome-svg-core/styles.css'
import initFontAwesome from '../utils/initFontAwesome'
import '../styles/globals.css'
import { CommerceLayerAuthProvider } from '../providers/CommerceLayerAuth'

initFontAwesome()

export default function App({ Component, pageProps }) {
  return (
    <Auth0Provider>
      <CommerceLayerAuthProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </CommerceLayerAuthProvider>
    </Auth0Provider>
  )
}
