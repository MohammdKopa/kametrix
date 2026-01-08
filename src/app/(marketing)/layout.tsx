"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#06040d] text-white relative overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-[#06040d] to-[#06040d] pointer-events-none" aria-hidden="true" />

      {/* Navigation header - Mobile responsive */}
      <header className="relative z-50 safe-area-inset-top">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" aria-label="Main navigation">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Kametrix
              </span>
            </Link>

            {/* Desktop Navigation links */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-sm text-gray-400 hover:text-white transition-colors min-h-[44px] flex items-center"
              >
                Funktionen
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm text-gray-400 hover:text-white transition-colors min-h-[44px] flex items-center"
              >
                So funktioniert&apos;s
              </Link>
            </div>

            {/* Mobile menu button & CTA */}
            <div className="flex items-center gap-3">
              {/* CTA button - visible on all screens */}
              <Link
                href="/login"
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all min-h-[44px] flex items-center"
              >
                <span className="hidden sm:inline">Anmelden</span>
                <span className="sm:hidden">Login</span>
              </Link>

              {/* Mobile menu toggle */}
              <button
                type="button"
                className="md:hidden p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Mobile menu panel */}
          <div
            id="mobile-menu"
            className={`
              fixed top-0 right-0 bottom-0 w-[min(80vw,320px)] bg-[#0a0612] border-l border-white/10
              z-50 transform transition-transform duration-300 ease-out md:hidden
              ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
            `}
            aria-hidden={!isMobileMenuOpen}
          >
            <div className="flex flex-col h-full safe-area-inset-top safe-area-inset-bottom">
              {/* Mobile menu header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="text-lg font-semibold">Menu</span>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Mobile menu links */}
              <nav className="flex-1 p-4 space-y-2" aria-label="Mobile navigation">
                <Link
                  href="#features"
                  className="block py-3 px-4 text-base text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors min-h-[44px]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Funktionen
                </Link>
                <Link
                  href="#how-it-works"
                  className="block py-3 px-4 text-base text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors min-h-[44px]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  So funktioniert&apos;s
                </Link>
              </nav>

              {/* Mobile menu footer */}
              <div className="p-4 border-t border-white/10">
                <Link
                  href="/login"
                  className="block w-full py-3 px-4 text-center text-sm font-medium rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors min-h-[44px]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Jetzt anmelden
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="relative z-10">{children}</main>

      {/* Footer - Mobile responsive */}
      <footer className="relative z-10 border-t border-white/10 mt-16 sm:mt-24 safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="text-sm text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()} Kametrix. Alle Rechte vorbehalten.
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/impressum"
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors min-h-[44px] flex items-center px-2"
              >
                Impressum
              </Link>
              <Link
                href="/datenschutz"
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors min-h-[44px] flex items-center px-2"
              >
                Datenschutz
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
