"use client";

import Link from "next/link";
import Image from "next/image";

export function PublicFooter() {
  return (
    <footer className="border-t bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 flex-shrink-0">
                <Image
                  src="/assets/logo.png"
                  alt="eBPLS Logo"
                  fill
                  className="object-contain rounded-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <span className="font-bold text-gray-900">eBPLS</span>
            </div>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Municipality of Enrique B. Magalona — Electronic Business Permits and Licensing System.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Services</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { href: "/requirements", label: "Requirements" },
                { href: "/how-to-apply", label: "How to Apply" },
                { href: "/faqs", label: "FAQs" },
                { href: "/track", label: "Track Application" },
                { href: "/verify-permit", label: "Verify Permit" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-500 hover:text-green-600 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
                { href: "/data-privacy", label: "Data Privacy Act" },
                { href: "/contact", label: "Contact Us" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-500 hover:text-green-600 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>Municipal Hall, Main Street</li>
              <li>(02) 8888-0000</li>
              <li>permits@lgu.gov.ph</li>
              <li>Mon–Fri, 8:00 AM – 5:00 PM</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Municipality of Enrique B. Magalona — BPLO. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Powered by the LGU Digital Transformation Initiative
          </p>
        </div>
      </div>
    </footer>
  );
}
