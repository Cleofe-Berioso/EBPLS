/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === "production";

function resolveAllowedDevOrigins() {
  const origins = new Set([
    "localhost:3000",
    "127.0.0.1:3000",
    "localhost:3001",
    "127.0.0.1:3001",
  ]);

  for (const value of [
    process.env.NEXTAUTH_URL,
    process.env.AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]) {
    if (!value) continue;
    try {
      const host = new URL(value).host;
      if (host) origins.add(host);
    } catch {
      // Ignore invalid URL values in env.
    }
  }

  return [...origins];
}

/**
 * HTTP security headers applied to every response.
 * These do not replace a WAF but add browser-level protections.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    proxyClientMaxBodySize: "20mb",
  },
  allowedDevOrigins: isProduction ? ["localhost:3000", "127.0.0.1:3000"] : resolveAllowedDevOrigins(),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
