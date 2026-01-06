'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Password Strength Indicator Component
 *
 * Provides real-time visual feedback on password strength including:
 * - Strength meter with animated bars
 * - Color-coded strength levels
 * - Requirement checklist with checkmarks
 * - Helpful suggestions
 */

export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-100
  requirements: PasswordRequirement[];
  suggestions: string[];
}

/**
 * Analyze password and return strength information
 */
export function analyzePassword(password: string): PasswordStrengthResult {
  const requirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  const suggestions: string[] = [];
  let score = 0;

  // Base score from length
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Score from character types
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  // Generate suggestions
  if (password.length < 12) {
    suggestions.push('Consider using 12+ characters for better security');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    suggestions.push('Add special characters (!@#$%) for extra security');
  }
  if (password.length > 0 && !/[A-Z]/.test(password)) {
    suggestions.push('Add an uppercase letter');
  }
  if (password.length > 0 && !/[0-9]/.test(password)) {
    suggestions.push('Add a number');
  }

  // Determine strength level
  let strength: PasswordStrength;
  if (score < 40) strength = 'weak';
  else if (score < 60) strength = 'medium';
  else if (score < 80) strength = 'strong';
  else strength = 'very-strong';

  return { strength, score: Math.min(score, 100), requirements, suggestions };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  showSuggestions?: boolean;
  className?: string;
}

const strengthConfig = {
  weak: {
    label: 'Weak',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    glowColor: 'shadow-red-500/30',
    bars: 1,
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    glowColor: 'shadow-yellow-500/30',
    bars: 2,
  },
  strong: {
    label: 'Strong',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    glowColor: 'shadow-green-500/30',
    bars: 3,
  },
  'very-strong': {
    label: 'Very Strong',
    color: 'bg-emerald-400',
    textColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-400/30',
    bars: 4,
  },
};

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
  showSuggestions = false,
  className = '',
}: PasswordStrengthIndicatorProps) {
  const analysis = useMemo(() => analyzePassword(password), [password]);
  const config = strengthConfig[analysis.strength];

  // Don't show anything if no password entered
  if (!password) {
    return null;
  }

  return (
    <motion.div
      className={`mt-3 ${className}`}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Strength meter */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Password strength</span>
          <motion.span
            key={analysis.strength}
            className={`text-xs font-medium ${config.textColor}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {config.label}
          </motion.span>
        </div>

        {/* Animated strength bars */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((barIndex) => (
            <motion.div
              key={barIndex}
              className={`h-1.5 flex-1 rounded-full overflow-hidden ${
                barIndex <= config.bars ? '' : 'bg-white/10'
              }`}
              initial={false}
            >
              <motion.div
                className={`h-full ${config.color} ${
                  barIndex <= config.bars ? `shadow-lg ${config.glowColor}` : ''
                }`}
                initial={{ width: 0 }}
                animate={{
                  width: barIndex <= config.bars ? '100%' : '0%',
                }}
                transition={{
                  duration: 0.3,
                  delay: barIndex * 0.05,
                  ease: 'easeOut',
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <motion.div
          className="mt-3 space-y-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {analysis.requirements.slice(0, 4).map((req, index) => (
            <motion.div
              key={req.label}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <motion.div
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  req.met
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-white/5 text-gray-500'
                }`}
                animate={{
                  scale: req.met ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {req.met ? (
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </motion.div>
              <span
                className={`text-xs ${
                  req.met ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                {req.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Suggestions */}
      {showSuggestions && analysis.suggestions.length > 0 && (
        <AnimatePresence>
          <motion.div
            className="mt-3 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <p className="text-xs text-purple-300 flex items-start gap-2">
              <svg
                className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{analysis.suggestions[0]}</span>
            </p>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

export default PasswordStrengthIndicator;
