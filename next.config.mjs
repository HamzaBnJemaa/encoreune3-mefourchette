/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ['firebase-admin', 'nodemailer'],
  eslint: { ignoreDuringBuilds: true },
  // Photos are public at /uploads/<file>; served by the API route (local + Firebase backends)
  async rewrites() {
    return [{ source: '/uploads/:name', destination: '/api/uploads/:name' }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
export default nextConfig;
