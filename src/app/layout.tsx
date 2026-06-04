import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Business Permit Online System | Municipality of Enrique B. Magalona",
  description:
    "Business Permit Online System — apply for business permits online, track assessment, submit payments, and receive your permit digitally.",
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
