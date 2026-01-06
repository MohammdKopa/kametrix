"use client";

import { motion } from "motion/react";
import { useCallback, useRef } from "react";
import {
  Clock,
  Calendar,
  Settings,
  Zap,
  FileText,
  CreditCard,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const features = [
  {
    icon: Clock,
    title: "24/7 Erreichbarkeit",
    description:
      "Ihr Assistent antwortet immer – auch nachts, am Wochenende und an Feiertagen.",
    gradient: "from-violet-500 to-purple-600",
    glowColor: "rgba(139, 92, 246, 0.4)",
  },
  {
    icon: Calendar,
    title: "Terminbuchung",
    description:
      "Direkte Integration mit Ihrem Google Kalender. Termine werden automatisch eingetragen.",
    gradient: "from-pink-500 to-rose-600",
    glowColor: "rgba(236, 72, 153, 0.4)",
  },
  {
    icon: Settings,
    title: "Individuelle Anpassung",
    description:
      "Passen Sie Ihren Assistenten an Ihr Unternehmen an – Begrüßung, Fragen, Antworten.",
    gradient: "from-purple-500 to-indigo-600",
    glowColor: "rgba(168, 85, 247, 0.4)",
  },
  {
    icon: Zap,
    title: "Einfache Einrichtung",
    description:
      "In wenigen Minuten startklar. Keine technischen Vorkenntnisse erforderlich.",
    gradient: "from-amber-400 to-orange-500",
    glowColor: "rgba(251, 191, 36, 0.4)",
  },
  {
    icon: FileText,
    title: "Anrufprotokoll",
    description:
      "Alle Gespräche werden dokumentiert. Behalten Sie den Überblick über jeden Anruf.",
    gradient: "from-cyan-400 to-blue-500",
    glowColor: "rgba(34, 211, 238, 0.4)",
  },
  {
    icon: CreditCard,
    title: "Faire Preise",
    description:
      "Nur zahlen was Sie nutzen. Keine versteckten Kosten, keine Mindestvertragslaufzeit.",
    gradient: "from-emerald-400 to-green-500",
    glowColor: "rgba(52, 211, 153, 0.4)",
  },
];

export function Features() {
  const gridRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for spotlight effect on grid
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const cards = gridRef.current?.querySelectorAll<HTMLElement>('[data-card]');
    if (!cards) return;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  }, []);

  return (
    <section id="features" className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION AMBIENT GLOW - Enhanced with multiple layers
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Primary ambient glow */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary ambient glow - offset for depth */}
      <div
        className="absolute top-[20%] right-[10%] w-[400px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(236, 72, 153, 0.08) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Section label */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Features</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent">
              Alles was Sie brauchen
            </span>
          </h2>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Ein KI-Telefonassistent, der Ihr Unternehmen{" "}
            <span className="text-gray-300">rund um die Uhr</span> unterstützt.
          </p>
        </motion.div>

        {/* Features grid with mouse tracking */}
        <motion.div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          onMouseMove={handleMouseMove}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative"
              data-card
            >
              {/* Card */}
              <div
                className="relative h-full p-8 rounded-2xl overflow-hidden transition-all duration-500"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.03)",
                }}
              >
                {/* Primary hover glow effect - follows mouse */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${feature.glowColor}, transparent 40%)`,
                  }}
                />

                {/* Secondary hover glow - larger, softer */}
                <div
                  className="absolute -inset-4 opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${feature.glowColor.replace('0.4', '0.15')}, transparent 60%)`,
                    filter: "blur(20px)",
                  }}
                />

                {/* Gradient border on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${feature.glowColor}, transparent 40%, ${feature.glowColor.replace('0.4', '0.2')})`,
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMaskComposite: "xor",
                    padding: "1px",
                  }}
                />

                {/* Icon container with enhanced glow */}
                <div className="relative mb-6">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 transition-all duration-300 group-hover:scale-110`}
                  >
                    <div className="w-full h-full rounded-[10px] bg-[#0a0812] flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Multi-layer icon glow */}
                  <div
                    className={`absolute inset-0 w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300`}
                  />
                  <div
                    className={`absolute -inset-2 w-18 h-18 rounded-xl bg-gradient-to-br ${feature.gradient} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                  />
                </div>

                {/* Content */}
                <h3 className="relative z-10 text-xl font-semibold text-white mb-3 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="relative z-10 text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>

                {/* Corner accent glow - enhanced */}
                <div
                  className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${feature.glowColor}, transparent 60%)`,
                    filter: "blur(50px)",
                  }}
                />

                {/* Bottom accent glow */}
                <div
                  className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${feature.glowColor.replace('0.4', '0.3')}, transparent 70%)`,
                    filter: "blur(40px)",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
