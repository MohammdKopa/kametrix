"use client";

import { motion } from "motion/react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#06040d] text-white relative overflow-hidden flex items-center justify-center">
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

      {/* ═══════════════════════════════════════════════════════════════════
          ENHANCED ATMOSPHERIC GLOW LAYERS - Animated for visual appeal
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Primary atmospheric glow - purple with breathing animation */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.15) 35%, rgba(139, 92, 246, 0.05) 55%, transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary atmospheric glow - magenta with drift animation */}
      <motion.div
        className="absolute top-[35%] left-[65%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(236, 72, 153, 0.3) 0%, rgba(168, 85, 247, 0.15) 40%, rgba(168, 85, 247, 0.05) 60%, transparent 70%)",
          filter: "blur(100px)",
        }}
        animate={{
          x: [0, 30, 0, -30, 0],
          y: [0, -20, 0, 20, 0],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Tertiary glow - blue accent for depth */}
      <motion.div
        className="absolute top-[60%] left-[35%] -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%)",
          filter: "blur(90px)",
        }}
        animate={{
          opacity: [0.4, 0.6, 0.4],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Subtle bottom glow - warm accent */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(139, 92, 246, 0.1) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          FLOATING ORB ACCENTS - Subtle ambient movement
      ═══════════════════════════════════════════════════════════════════ */}

      {/* Small floating orb - top right */}
      <motion.div
        className="absolute top-[20%] right-[20%] pointer-events-none"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative w-2 h-2">
          <div className="absolute inset-0 rounded-full bg-purple-400" />
          <div className="absolute -inset-1 rounded-full bg-purple-400/30 blur-sm" />
        </div>
      </motion.div>

      {/* Small floating orb - bottom left */}
      <motion.div
        className="absolute bottom-[25%] left-[15%] pointer-events-none"
        animate={{
          y: [0, 15, 0],
          opacity: [0.25, 0.4, 0.25],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="relative w-1.5 h-1.5">
          <div className="absolute inset-0 rounded-full bg-pink-400" />
          <div className="absolute -inset-1 rounded-full bg-pink-400/25 blur-sm" />
        </div>
      </motion.div>

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
