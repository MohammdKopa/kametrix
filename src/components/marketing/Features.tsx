import {
  Clock,
  Calendar,
  Settings,
  Zap,
  FileText,
  CreditCard,
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "24/7 Erreichbarkeit",
    description:
      "Ihr Assistent antwortet immer – auch nachts, am Wochenende und an Feiertagen.",
  },
  {
    icon: Calendar,
    title: "Terminbuchung",
    description:
      "Direkte Integration mit Ihrem Google Kalender. Termine werden automatisch eingetragen.",
  },
  {
    icon: Settings,
    title: "Individuelle Anpassung",
    description:
      "Passen Sie Ihren Assistenten an Ihr Unternehmen an – Begrüßung, Fragen, Antworten.",
  },
  {
    icon: Zap,
    title: "Einfache Einrichtung",
    description:
      "In wenigen Minuten startklar. Keine technischen Vorkenntnisse erforderlich.",
  },
  {
    icon: FileText,
    title: "Anrufprotokoll",
    description:
      "Alle Gespräche werden dokumentiert. Behalten Sie den Überblick über jeden Anruf.",
  },
  {
    icon: CreditCard,
    title: "Faire Preise",
    description:
      "Nur zahlen was Sie nutzen. Keine versteckten Kosten, keine Mindestvertragslaufzeit.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Alles was Sie brauchen
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Ein KI-Telefonassistent, der Ihr Unternehmen rund um die Uhr
            unterstützt.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <feature.icon className="w-6 h-6 text-purple-400" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Subtle corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/5 to-transparent rounded-tr-xl pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
