"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";

export function Hero() {
  const { scrollYProgress } = useScroll();

  // Scroll-linked transforms for the glow layers
  const primaryGlowOpacity = useTransform(scrollYProgress, [0, 0.25], [0.6, 0]);
  const primaryGlowScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.5]);
  const secondaryGlowOpacity = useTransform(scrollYProgress, [0, 0.2], [0.4, 0]);
  const accentGlowOpacity = useTransform(scrollYProgress, [0, 0.15], [0.3, 0]);

  // Parallax for floating elements
  const floatY1 = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const floatY2 = useTransform(scrollYProgress, [0, 0.3], [0, -120]);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          ATMOSPHERIC GLOW LAYERS - Creates the "void with light" effect
          Multiple layers at different positions for depth
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Primary glow - large purple behind headline */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{
          opacity: primaryGlowOpacity,
          scale: primaryGlowScale,
          background: "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Secondary glow - magenta/pink offset */}
      <motion.div
        className="absolute top-[30%] left-[60%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          opacity: secondaryGlowOpacity,
          background: "radial-gradient(ellipse at center, rgba(236, 72, 153, 0.35) 0%, rgba(168, 85, 247, 0.15) 50%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Accent glow - subtle blue undertone for depth */}
      <motion.div
        className="absolute top-[60%] left-[30%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          opacity: accentGlowOpacity,
          background: "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.25) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          FLOATING ORBS - Adds depth and movement
      ═══════════════════════════════════════════════════════════════════ */}

      <motion.div
        className="absolute top-[20%] right-[15%] w-2 h-2 rounded-full bg-purple-400/60 pointer-events-none"
        style={{ y: floatY1 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[35%] left-[12%] w-1.5 h-1.5 rounded-full bg-pink-400/50 pointer-events-none"
        style={{ y: floatY2 }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute top-[60%] right-[20%] w-1 h-1 rounded-full bg-violet-300/40 pointer-events-none"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          NOISE TEXTURE OVERLAY - Adds grain for premium feel
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Glassmorphic Badge */}
        <motion.div
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-10 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 4px 24px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Badge glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />
          <span className="relative w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400">
            <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-75" />
          </span>
          <span className="relative text-sm font-medium text-gray-200 tracking-wide">
            KI-Telefonassistent für Ihr Business
          </span>
        </motion.div>

        {/* Headline - Bold and dramatic */}
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-8 leading-[1.1]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <span className="block bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent">
            Ihr KI-Assistent.
          </span>
          <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
            Sofort einsatzbereit.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          Verpassen Sie nie wieder einen Anruf. Unser KI-Assistent beantwortet
          Kundenanfragen und bucht Termine –{" "}
          <span className="text-gray-300">rund um die Uhr.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          {/* Primary CTA - Glowing gradient button */}
          <Link
            href="/signup"
            className="group relative px-10 py-5 rounded-2xl font-semibold text-white overflow-hidden transition-all duration-300"
          >
            {/* Button background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 transition-all duration-300 group-hover:scale-105" />

            {/* Inner glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300" />

            {/* Button text */}
            <span className="relative z-10 flex items-center gap-2">
              Kostenlos starten
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>

          {/* Secondary CTA - Glassmorphic */}
          <Link
            href="#how-it-works"
            className="group relative px-10 py-5 rounded-2xl font-semibold text-gray-200 overflow-hidden transition-all duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Hover gradient border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Demo ansehen
            </span>
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          className="mt-20 pt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          {/* Decorative line with gradient */}
          <div className="w-full max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-10" />

          <p className="text-sm text-gray-500 mb-6 tracking-wide uppercase">
            Vertraut von Unternehmen in Deutschland
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              { icon: "check", label: "DSGVO-konform" },
              { icon: "shield", label: "256-bit Verschlüsselung" },
              { icon: "zap", label: "Sofort einsatzbereit" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-gray-500 group hover:text-gray-400 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:border-purple-500/30 group-hover:bg-purple-500/5 transition-all">
                  {item.icon === "check" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {item.icon === "shield" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  {item.icon === "zap" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-2 rounded-full bg-white/60"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
