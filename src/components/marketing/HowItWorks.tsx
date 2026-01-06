"use client";

import { motion } from "motion/react";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const steps = [
  {
    number: "01",
    title: "Registrieren",
    description:
      "Erstellen Sie Ihr Konto in Sekunden. Keine Kreditkarte erforderlich – starten Sie sofort kostenlos.",
    gradient: "from-violet-500 to-purple-600",
    glowColor: "rgba(139, 92, 246, 0.5)",
  },
  {
    number: "02",
    title: "Konfigurieren",
    description:
      "Passen Sie Ihren KI-Assistenten an. Definieren Sie Begrüßung, Öffnungszeiten und häufige Fragen.",
    gradient: "from-pink-500 to-rose-500",
    glowColor: "rgba(236, 72, 153, 0.5)",
  },
  {
    number: "03",
    title: "Loslegen",
    description:
      "Erhalten Sie Ihre Telefonnummer und starten Sie sofort. Ihr KI-Assistent ist bereit für Anrufe.",
    gradient: "from-emerald-400 to-teal-500",
    glowColor: "rgba(52, 211, 153, 0.5)",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION AMBIENT GLOW - Enhanced with multiple animated layers
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Primary ambient glow with breathing animation */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.1) 0%, rgba(139, 92, 246, 0.04) 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          opacity: [0.7, 1, 0.7],
          scale: [1, 1.03, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary glow - pink accent */}
      <div
        className="absolute top-[50%] left-[20%] w-[400px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(236, 72, 153, 0.08) 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />

      {/* Tertiary glow - teal accent for the last step */}
      <div
        className="absolute top-[40%] right-[15%] w-[350px] h-[350px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(52, 211, 153, 0.06) 0%, transparent 60%)",
          filter: "blur(90px)",
        }}
      />

      <div className="relative max-w-6xl mx-auto">
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
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              So funktioniert&apos;s
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent">
              In 3 Schritten startklar
            </span>
          </h2>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Keine komplizierte Einrichtung.{" "}
            <span className="text-gray-300">Einfach starten.</span>
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line - desktop only - Enhanced with multi-layer glow */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-px">
            {/* Base line */}
            <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

            {/* Glow layer under the line */}
            <div
              className="absolute -top-1 left-0 right-0 h-3 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"
              style={{ filter: "blur(4px)" }}
            />

            {/* Primary animated glow traveling along the line */}
            <motion.div
              className="absolute -top-1 w-32 h-3"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), rgba(236, 72, 153, 0.5), transparent)",
                filter: "blur(6px)",
              }}
              animate={{ left: ["-10%", "110%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Secondary trailing glow */}
            <motion.div
              className="absolute -top-0.5 w-16 h-2"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent)",
                filter: "blur(2px)",
              }}
              animate={{ left: ["-5%", "105%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 0.1 }}
            />

            {/* Pulse points at step positions */}
            {[0, 50, 100].map((position, idx) => (
              <motion.div
                key={idx}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-400"
                style={{ left: `${position}%`, marginLeft: position === 100 ? '-8px' : position === 0 ? '0' : '-4px' }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.3 }}
              />
            ))}
          </div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                variants={stepVariants}
              >
                {/* Step card */}
                <div className="group relative text-center lg:text-left">
                  {/* Number badge with enhanced multi-layer glow */}
                  <div className="relative inline-flex items-center justify-center mb-8">
                    {/* Outer glow ring - large diffuse */}
                    <motion.div
                      className="absolute w-24 h-24 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle, ${step.glowColor}, transparent 60%)`,
                        filter: "blur(25px)",
                      }}
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.4, 0.3],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                    />

                    {/* Middle glow ring */}
                    <div
                      className="absolute w-20 h-20 rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle, ${step.glowColor}, transparent 70%)`,
                        filter: "blur(15px)",
                      }}
                    />

                    {/* Inner glow ring */}
                    <div
                      className="absolute w-16 h-16 rounded-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${step.glowColor}, transparent)`,
                        filter: "blur(8px)",
                      }}
                    />

                    {/* Number container */}
                    <motion.div
                      className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} p-[2px] transition-transform duration-300 group-hover:scale-110`}
                      whileHover={{ rotate: [0, -3, 3, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <div
                        className="w-full h-full rounded-[14px] flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, rgba(6, 4, 13, 0.95), rgba(15, 10, 25, 0.98))",
                        }}
                      >
                        <span className="text-xl font-bold bg-gradient-to-br from-white to-gray-300 bg-clip-text text-transparent">
                          {step.number}
                        </span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Content card */}
                  <div
                    className="relative p-6 rounded-2xl transition-all duration-500"
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(400px circle at 50% 0%, ${step.glowColor.replace("0.5", "0.1")}, transparent 60%)`,
                      }}
                    />

                    <h3 className="relative text-2xl font-bold text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="relative text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Arrow - mobile only */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-8">
                    <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg
                        className="w-8 h-8 text-purple-500/40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA section */}
        <motion.div
          className="mt-24 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* CTA Card */}
          <div
            className="relative inline-block max-w-2xl w-full p-10 rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.05))",
              border: "1px solid rgba(139, 92, 246, 0.15)",
            }}
          >
            {/* Background glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] pointer-events-none"
              style={{
                background: "radial-gradient(ellipse, rgba(139, 92, 246, 0.2), transparent 70%)",
                filter: "blur(40px)",
              }}
            />

            {/* Content */}
            <div className="relative">
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Bereit loszulegen?
              </h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                Testen Sie Kametrix kostenlos.{" "}
                <span className="text-gray-300">Keine Kreditkarte erforderlich.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Primary CTA */}
                <Link
                  href="/signup"
                  className="group relative px-10 py-5 rounded-2xl font-semibold text-white overflow-hidden transition-all duration-300"
                >
                  {/* Button background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 transition-all duration-300 group-hover:scale-105" />

                  {/* Inner shine */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Outer glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />

                  <span className="relative z-10 flex items-center gap-2">
                    Jetzt kostenlos starten
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>

                {/* Secondary link */}
                <Link
                  href="#features"
                  className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-medium"
                >
                  Mehr erfahren
                </Link>
              </div>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-30">
              <div className="absolute top-4 right-4 w-px h-12 bg-gradient-to-b from-purple-400 to-transparent" />
              <div className="absolute top-4 right-4 w-12 h-px bg-gradient-to-l from-purple-400 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none opacity-30">
              <div className="absolute bottom-4 left-4 w-px h-12 bg-gradient-to-t from-pink-400 to-transparent" />
              <div className="absolute bottom-4 left-4 w-12 h-px bg-gradient-to-r from-pink-400 to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
