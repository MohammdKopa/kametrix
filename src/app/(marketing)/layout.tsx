import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#06040d] text-white relative overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-[#06040d] to-[#06040d] pointer-events-none" />

      {/* Navigation header */}
      <header className="relative z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
            >
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Kametrix
              </span>
            </Link>

            {/* Navigation links */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Funktionen
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                So funktioniert&apos;s
              </Link>
            </div>

            {/* CTA button */}
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              Anmelden
            </Link>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="relative z-10">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Kametrix. Alle Rechte vorbehalten.
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/impressum"
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Impressum
              </Link>
              <Link
                href="/datenschutz"
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
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
