'use client';

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  fixed?: boolean;
}

export default function ThemeToggle({ fixed = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        ...(fixed
          ? {
              position: 'fixed',
              top: '1.5rem',
              right: '1.5rem',
              zIndex: 50,
            }
          : {
              position: 'relative',
            }),
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.55rem 1rem',
        borderRadius: '9999px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--surface-card)',
        color: 'var(--text)',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.85rem',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px var(--shadow-color)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(360deg)',
          transition: 'transform 0.4s ease',
          color: theme === 'dark' ? 'var(--secondary-accent)' : 'var(--primary-accent)',
        }}
      >
        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
      </span>
      <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
    </button>
  );
}
