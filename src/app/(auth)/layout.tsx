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

      {/* Primary atmospheric glow - purple */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Secondary atmospheric glow - magenta */}
      <div
        className="absolute top-[40%] left-[60%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
