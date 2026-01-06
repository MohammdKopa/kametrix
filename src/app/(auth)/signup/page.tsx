'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { PasswordStrengthIndicator, analyzePassword } from '@/components/ui/password-strength-indicator';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Client-side password strength validation
    const passwordAnalysis = analyzePassword(password);
    if (passwordAnalysis.strength === 'weak') {
      setError('Please choose a stronger password. It should include uppercase, lowercase, and numbers.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
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
        <p className="text-gray-400 mt-2">Create your account</p>
      </motion.div>

      {/* Glassmorphic card */}
      <motion.div
        className="relative rounded-2xl p-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
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

          {/* Name field */}
          <div className="mb-5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name <span className="text-gray-500">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              placeholder="Your name"
            />
          </div>

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
              minLength={8}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              placeholder="Create a password"
            />
            {/* Password strength indicator */}
            <PasswordStrengthIndicator
              password={password}
              showRequirements={true}
              showSuggestions={true}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Button background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 transition-all duration-300 group-hover:scale-105 group-disabled:scale-100" />

            {/* Inner glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/5 opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity duration-300" />

            {/* Outer glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 group-disabled:opacity-20 transition-opacity duration-300" />

            {/* Button text */}
            <span className="relative z-10">
              {loading ? 'Creating account...' : 'Create account'}
            </span>
          </button>
        </form>
      </motion.div>

      {/* Sign in link */}
      <motion.p
        className="text-center text-sm text-gray-400 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Already have an account?{' '}
        <Link href="/login" className="text-purple-400 font-medium hover:text-purple-300 transition-colors">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
