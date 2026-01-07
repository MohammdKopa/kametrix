'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [theme, setTheme]);

  // Handle keyboard activation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTheme();
    }
  }, [toggleTheme]);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Toggle theme"
        aria-pressed={undefined}
        disabled
      >
        <div className="w-5 h-5" aria-hidden="true" />
        <span className="sr-only">Loading theme toggle</span>
      </button>
    );
  }

  const isDark = theme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';

  return (
    <button
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
      className="p-2 rounded-lg border transition-all duration-150
        border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300
        dark:border-[var(--border)] dark:bg-[var(--background-secondary)] dark:hover:bg-[var(--muted)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`Current theme: ${isDark ? 'dark' : 'light'} mode. Click to switch to ${nextTheme} mode`}
      aria-pressed={isDark}
      role="switch"
      aria-checked={isDark}
      title={`Switch to ${nextTheme} mode`}
    >
      <div className="relative w-5 h-5" aria-hidden="true">
        <Sun
          className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
          }`}
          aria-hidden="true"
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 text-purple-400 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
          }`}
          aria-hidden="true"
        />
      </div>
      <span className="sr-only">
        {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
      </span>
    </button>
  );
}
