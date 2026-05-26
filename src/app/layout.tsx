import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "eBPPS | Electronic Business Permits and Licensing System",
  description:
    "Electronic Business Permits and Licensing System for online business permit applications, assessment, payment tracking, and permit release.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
