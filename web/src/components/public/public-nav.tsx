"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/requirements", label: "Requirements" },
  { href: "/how-to-apply", label: "How to Apply" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact Us" },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/login"
          className="flex items-center gap-2.5 min-w-0"
          onClick={() => setOpen(false)}
        >
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
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight text-gray-900 sm:text-lg">
              eBPLS
            </p>
            <p className="hidden text-xs text-gray-500 sm:block">
              Municipality of Enrique B. Magalona
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-2 flex items-center gap-2">
            <Link
              href="/track"
              className="rounded-lg border border-green-200 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50"
            >
              Track Application
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* Mobile: Sign In + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/login"
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Sign In
          </Link>
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-[57px] z-40 bg-black/20 md:hidden"
            onClick={() => setOpen(false)}
          />
          {/* Menu */}
          <nav className="absolute left-0 right-0 top-full z-50 border-b bg-white px-4 pb-4 pt-2 shadow-lg md:hidden">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-green-50 text-green-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/track"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-green-600 hover:bg-green-50"
                >
                  Track Application
                </Link>
              </li>
              <li className="pt-2 border-t mt-1">
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Create Account
                </Link>
              </li>
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}
