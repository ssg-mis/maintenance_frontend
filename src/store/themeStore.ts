import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  initTheme: () => void;
}

const STORAGE_KEY = 'maintenance-theme-preference';

// Helper to get system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Helper to apply class to <html> element
const applyThemeClass = (resolved: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',

  setTheme: (theme: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Unable to persist theme to localStorage', e);
    }

    const resolved = theme === 'system' ? getSystemTheme() : theme;
    applyThemeClass(resolved);

    set({ theme, resolvedTheme: resolved });
  },

  initTheme: () => {
    let savedTheme: ThemeMode = 'system';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        savedTheme = stored;
      }
    } catch (e) {
      console.warn('Unable to read theme from localStorage', e);
    }

    const resolved = savedTheme === 'system' ? getSystemTheme() : savedTheme;
    applyThemeClass(resolved);
    set({ theme: savedTheme, resolvedTheme: resolved });

    // Listen for OS/browser color scheme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemChange = (e: MediaQueryListEvent) => {
        const currentTheme = get().theme;
        if (currentTheme === 'system') {
          const newResolved = e.matches ? 'dark' : 'light';
          applyThemeClass(newResolved);
          set({ resolvedTheme: newResolved });
        }
      };

      try {
        mediaQuery.addEventListener('change', handleSystemChange);
      } catch (err) {
        // Fallback for older browsers
        mediaQuery.addListener(handleSystemChange);
      }
    }
  },
}));

export default useThemeStore;
