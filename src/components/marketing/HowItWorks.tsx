import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Registrieren",
    description:
      "Erstellen Sie Ihr Konto in Sekunden. Keine Kreditkarte erforderlich.",
  },
  {
    number: "02",
    title: "Konfigurieren",
    description:
      "Passen Sie Ihren KI-Assistenten an Ihr Unternehmen an. Definieren Sie Begrüßung, Öffnungszeiten und häufige Fragen.",
  },
  {
    number: "03",
    title: "Loslegen",
    description:
      "Erhalten Sie Ihre Telefonnummer und starten Sie sofort mit dem Empfang von Anrufen.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              So funktioniert&apos;s
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            In drei einfachen Schritten zum eigenen KI-Telefonassistenten.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line - desktop only */}
          <div className="hidden lg:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step card */}
                <div className="text-center lg:text-left">
                  {/* Number badge */}
                  <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
                    <span className="text-sm font-bold text-purple-400">
                      {step.number}
                    </span>
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-lg" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow - mobile only */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-6">
                    <svg
                      className="w-6 h-6 text-purple-500/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA section */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-8 rounded-2xl bg-gradient-to-r from-purple-900/20 to-purple-800/10 border border-purple-500/20">
            <div className="text-left">
              <h3 className="text-xl font-semibold text-white mb-2">
                Bereit loszulegen?
              </h3>
              <p className="text-gray-400">
                Starten Sie noch heute kostenlos.
              </p>
            </div>
            <Link
              href="/signup"
              className="px-8 py-4 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 whitespace-nowrap"
            >
              Jetzt starten
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
