/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    // Total request-body cap for middleware handling; per-file 10 MB is still enforced in app validation.
    middlewareClientMaxBodySize: "150mb",
  },
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "supereffectively-mycostatic-lilla.ngrok-free.dev",
    "*.ngrok-free.dev",
  ],
};

export default nextConfig;