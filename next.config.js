/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    domains: ['localhost'],
  },
  async headers() {
    // For production, we need dynamic CORS based on the request origin
    // This will be handled by middleware since Next.js headers don't have access to request origin
    const corsOrigin = process.env.NODE_ENV === 'production' 
      ? 'https://nextearningsrelease.com' // Primary domain
      : '*';
      
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          // Production domains: nextearningsrelease.com and lanoitcif.com (legacy)
          { key: 'Access-Control-Allow-Origin', value: corsOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ]
      }
    ]
  }
}

module.exports = nextConfig
