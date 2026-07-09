'use client';

import React, { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = 'zion-theme';
const DEFAULT_THEME_STORAGE_KEY = 'zion-default-theme';
const themeSubscribers = new Set<() => void>();

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const defaultTheme = window.localStorage.getItem(DEFAULT_THEME_STORAGE_KEY);

  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return defaultTheme === 'dark' ? 'dark' : 'light';
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

  useEffect(() => {
    let active = true;

    async function loadDefaultTheme() {
      try {
        const response = await fetch('/api/client/settings', { cache: 'no-store' });
        const payload = await response.json() as {
          settings?: {
            appearance?: {
              defaultTheme?: Theme;
            };
          };
        };
        const defaultTheme = payload.settings?.appearance?.defaultTheme;

        if (!active || (defaultTheme !== 'dark' && defaultTheme !== 'light')) {
          return;
        }

        window.localStorage.setItem(DEFAULT_THEME_STORAGE_KEY, defaultTheme);

        if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
          applyDocumentTheme(defaultTheme);
          notifyThemeSubscribers();
        }
      } catch {
        // Keep the local theme fallback if public settings are unavailable.
      }
    }

    void loadDefaultTheme();

    return () => {
      active = false;
    };
  }, []);

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
