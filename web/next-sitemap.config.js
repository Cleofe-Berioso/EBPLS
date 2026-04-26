/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXTAUTH_URL || "https://permit.lgu.gov.ph",
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: "weekly",
  priority: 0.7,
  exclude: [
    "/",
    "/dashboard*",
    "/api/*",
    "/verify-otp",
    "/forgot-password",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/", "/verify-otp"],
      },
    ],
    additionalSitemaps: [],
  },
  transform: async (config, path) => {
    // Custom priority for key pages
    const priorities = {
      "/login": 0.8,
      "/register": 0.8,
      "/requirements": 0.9,
      "/how-to-apply": 0.9,
      "/faqs": 0.8,
      "/contact": 0.7,
      "/privacy": 0.5,
      "/terms": 0.5,
      "/data-privacy": 0.5,
    };

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: priorities[path] || config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
