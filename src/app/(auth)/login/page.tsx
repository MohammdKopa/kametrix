'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Logo and title */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Link href="/" className="inline-block">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Kametrix
            </span>
          </h1>
        </Link>
        <p className="text-gray-400 mt-2">Sign in to your account</p>
      </motion.div>

      {/* Enhanced Glassmorphic card with glow effects */}
      <motion.div
        className="relative rounded-2xl p-8 group/card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 60px rgba(139, 92, 246, 0.05)",
        }}
      >
        {/* Card ambient glow */}
        <div
          className="absolute -inset-1 rounded-3xl opacity-40 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15), transparent 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* Card border glow on focus-within */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-focus-within/card:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), transparent 50%, rgba(236, 72, 153, 0.15))",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
        <form onSubmit={handleSubmit}>
          {/* Error message */}
          {error && (
            <motion.div
              className="mb-6 p-4 text-sm text-red-400 rounded-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Email field */}
          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              placeholder="you@example.com"
            />
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              placeholder="Enter your password"
            />
          </div>

          {/* Enhanced Submit button with multi-layer glow */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Ambient outer glow - always visible */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/40 via-pink-500/30 to-purple-600/40 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 group-disabled:opacity-30 transition-all duration-500" />

            {/* Secondary outer glow layer for depth */}
            <div className="absolute -inset-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 group-disabled:opacity-20 transition-all duration-500" />

            {/* Button background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 transition-all duration-300 group-hover:scale-105 group-disabled:scale-100" />

            {/* Inner glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/5 opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity duration-300" />

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out group-disabled:translate-x-0 group-disabled:opacity-0" />

            {/* Primary outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl blur-lg opacity-40 group-hover:opacity-70 group-disabled:opacity-20 transition-all duration-300" />

            {/* Button text */}
            <span className="relative z-10">
              {loading ? 'Signing in...' : 'Sign in'}
            </span>
          </button>
        </form>
      </motion.div>

      {/* Sign up link */}
      <motion.p
        className="text-center text-sm text-gray-400 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-purple-400 font-medium hover:text-purple-300 transition-colors">
          Sign up
        </Link>
      </motion.p>
    </motion.div>
  );
}
