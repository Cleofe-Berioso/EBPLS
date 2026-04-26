/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "puppeteer", 
    "@sentry/nextjs", 
    "bullmq", 
    "nodemailer", 
    "pg", 
    "@prisma/adapter-pg", 
    "pg-connection-string",
    "pgpass",
    "split2"
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Handle Node.js built-in modules for instrumentation
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle these packages - use Node.js require at runtime
      config.externals = config.externals || [];
      config.externals.push({
        'pg': 'commonjs pg',
        'pg-connection-string': 'commonjs pg-connection-string',
        'pgpass': 'commonjs pgpass',
        'nodemailer': 'commonjs nodemailer',
        '@prisma/adapter-pg': 'commonjs @prisma/adapter-pg',
      });
    }
    // Prevent infinite hot reload loops by excluding large/generated directories
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['**/.git/**', '**/node_modules/**', '**/.next/**'],
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HSTS — enforce HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // XSS Protection (legacy browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          // Content Security Policy
          // 'unsafe-inline' for script-src is required by Next.js 15 App Router inline hydration scripts.
          // 'unsafe-eval' is only added in development for Next.js Fast Refresh (react-refresh/HMR).
          // Production builds never need unsafe-eval.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.semaphore.co https://api.paymongo.com https://pg-sandbox.paymaya.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
