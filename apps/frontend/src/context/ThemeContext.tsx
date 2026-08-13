'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (newTheme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<Theme>('light');

  // Sync state on mount from localStorage (which was initialized by inline script)
  useEffect(() => {
    try {
      const savedLocalTheme = localStorage.getItem('trackmyhabits_theme') as Theme | null;
      if (savedLocalTheme === 'dark' || savedLocalTheme === 'light') {
        setTheme(savedLocalTheme);
        document.documentElement.setAttribute('data-theme', savedLocalTheme);
      } else {
        setTheme('light');
        localStorage.setItem('trackmyhabits_theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {
      setTheme('light');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('trackmyhabits_theme', newTheme);
    } catch (e) {}

    // If authenticated, persist choice to Prisma DB
    if (session?.user) {
      fetch('/api/user/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      }).catch((err) => console.error('Failed to persist theme to database:', err));
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  };

  const setThemeMode = (newTheme: Theme) => {
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
