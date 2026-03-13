'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  size?: 'default' | 'sm';
}

export default function ThemeToggle({ size = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isSm = size === 'sm';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Midnight mode'}
      className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-gray-300 bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 ${
        isSm ? 'h-6 w-10 focus:ring-offset-1' : 'h-9 w-16'
      }`}
    >
      <span className="sr-only">{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
      <span
        className={`pointer-events-none inline-flex transform items-center justify-center rounded-full bg-white shadow ring-0 transition duration-200 dark:bg-gray-800 ${
          isSm ? 'h-4 w-4' : 'h-7 w-7'
        }`}
        style={{
          transform: theme === 'dark' ? (isSm ? 'translateX(1.5rem)' : 'translateX(2rem)') : isSm ? 'translateX(0.125rem)' : 'translateX(0.25rem)',
        }}
      >
        {theme === 'light' ? (
          <Sun className={isSm ? 'h-2.5 w-2.5 text-amber-500' : 'h-4 w-4 text-amber-500'} aria-hidden />
        ) : (
          <Moon className={isSm ? 'h-2.5 w-2.5 text-slate-300' : 'h-4 w-4 text-slate-300'} aria-hidden />
        )}
      </span>
    </button>
  );
}
