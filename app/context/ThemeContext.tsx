'use client';

import React, { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = 'zion-theme';
const themeSubscribers = new Set<() => void>();

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

function getServerTheme(): Theme {
  return 'light';
}

function subscribeToTheme(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  themeSubscribers.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    themeSubscribers.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function notifyThemeSubscribers() {
  themeSubscribers.forEach((callback) => callback());
}

function applyDocumentTheme(theme: Theme) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, getServerTheme);

  useEffect(() => {
    applyDocumentTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback((newTheme: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyDocumentTheme(newTheme);
    notifyThemeSubscribers();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
