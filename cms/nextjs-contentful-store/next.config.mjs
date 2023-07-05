/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "cdn.contentful.com" },
      { hostname: "images.ctfassets.net" },
      { hostname: "images.unsplash.com" },
      { hostname: "data.commercelayer.app" }
    ]
  },
  env: {
    JSCOV: 0
  }
};

export default nextConfig;
