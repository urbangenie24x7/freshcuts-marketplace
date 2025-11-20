// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  // Transpile undici so SWC compiles its modern syntax for the browser bundle
  transpilePackages: ['undici']
}

module.exports = nextConfig