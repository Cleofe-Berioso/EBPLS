import type { Metadata } from "next";
import "./globals.css";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import {
  GovernmentServiceSchema,
  OrganizationSchema,
  WebApplicationSchema,
} from "@/components/seo/json-ld";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Online Business Permit System",
    template: "%s | Online Business Permit System",
  },
  description:
    "Apply for your business permit online. Fast, secure, and convenient business permit application, renewal, and claiming for your Local Government Unit.",
  keywords: [
    "business permit",
    "online permit",
    "business license",
    "LGU permit",
    "Philippines business permit",
    "permit application",
    "permit renewal",
  ],
  authors: [{ name: "LGU IT Department" }],
  openGraph: {
    title: "Online Business Permit System",
    description:
      "Apply for your business permit online. Fast, secure, and convenient.",
    type: "website",
    locale: "en_PH",
    siteName: "Online Business Permit System",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BizPermit",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563EB" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <GovernmentServiceSchema />
        <OrganizationSchema />
        <WebApplicationSchema />
      </head>
      <body className="min-h-screen bg-[var(--background)] font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
        <CookieConsent />
        <ServiceWorkerRegistration />
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
