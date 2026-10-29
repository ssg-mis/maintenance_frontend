import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useThemeStore, ThemeMode } from "../store/themeStore";

interface ThemeOption {
  id: ThemeMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const themeOptions: ThemeOption[] = [
  {
    id: "light",
    label: "Light Mode",
    description: "Bright & clear workspace",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark Mode",
    description: "Gentle on eyes, sleek dark UI",
    icon: Moon,
  },
  {
    id: "system",
    label: "System",
    description: "Matches your device theme",
    icon: Monitor,
  },
];

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const CurrentIcon =
    theme === "system"
      ? Monitor
      : theme === "dark"
      ? Moon
      : Sun;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Theme switcher, currently ${theme} mode`}
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
          isOpen
            ? "bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400"
            : "text-gray-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-slate-800"
        }`}
        title={`Current theme: ${theme} (${resolvedTheme})`}
      >
        <CurrentIcon size={19} className="transition-transform duration-300" />
        <span className="sr-only">Switch theme</span>

        {/* Small subtle badge indicating mode if in system */}
        {theme === "system" && (
          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-500 ring-1 ring-white dark:ring-slate-900" />
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-11 z-50 w-64 p-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 backdrop-blur-lg animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800/80 mb-1">
            <p className="text-xs font-semibold text-gray-900 dark:text-slate-100">
              Appearance
            </p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Customize website theme preference
            </p>
          </div>

          <div className="space-y-1">
            {themeOptions.map((option) => {
              const isSelected = theme === option.id;
              const Icon = option.icon;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setTheme(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-150 group ${
                    isSelected
                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-medium border border-sky-100 dark:border-sky-800/60"
                      : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/70 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                        isSelected
                          ? "bg-sky-500 text-white shadow-sm"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400"
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight truncate">
                        {option.label}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-400 leading-tight truncate">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check
                      size={15}
                      className="text-sky-600 dark:text-sky-400 flex-shrink-0 ml-2"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* System mode active indicator banner */}
          {theme === "system" && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800/80 px-2 py-1 text-[10px] text-gray-500 dark:text-slate-400 flex items-center justify-between">
              <span>Auto-detecting OS:</span>
              <span className="font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider text-[9px] bg-sky-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {resolvedTheme} mode
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
