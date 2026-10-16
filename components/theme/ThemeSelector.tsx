"use client";

import * as React from "react";
import { Palette, Check, ChevronDown } from "lucide-react";
import { THEME_LIST, ThemeId, DEFAULT_THEME, THEMES, isValidTheme } from "@/lib/theme";
import { setThemeAction } from "@/lib/actions/theme";
import { toast } from "sonner";

interface ThemeSelectorProps {
  align?: "left" | "right";
  variant?: "pill" | "compact";
  className?: string;
}

export function ThemeSelector({
  align = "right",
  variant = "compact",
  className = "",
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeThemeId, setActiveThemeId] = React.useState<ThemeId>(DEFAULT_THEME);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Sync active theme from DOM attribute on mount & custom events
  React.useEffect(() => {
    const updateFromDom = () => {
      const current = document.documentElement.getAttribute("data-theme");
      if (isValidTheme(current)) {
        setActiveThemeId(current);
      }
    };

    updateFromDom();

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && isValidTheme(customEvent.detail)) {
        setActiveThemeId(customEvent.detail);
      }
    };

    window.addEventListener("hackline-theme-changed", handleThemeChange);
    return () => window.removeEventListener("hackline-theme-changed", handleThemeChange);
  }, []);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectTheme = (themeId: ThemeId) => {
    if (themeId === activeThemeId) {
      setIsOpen(false);
      return;
    }

    // 1. Optimistic instant visual update (0ms lag)
    document.documentElement.setAttribute("data-theme", themeId);
    if (THEMES[themeId].category === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setActiveThemeId(themeId);
    setIsOpen(false);

    // 2. Dispatch event for other selectors (e.g. Settings page)
    window.dispatchEvent(new CustomEvent("hackline-theme-changed", { detail: themeId }));

    // 3. Persist to 1-year cookie and Supabase profile in background
    setThemeAction(themeId).catch(() => {
      // Non-blocking fail-safe
    });

    toast.success(`Theme updated to ${THEMES[themeId].name}`);
  };

  const currentTheme = THEMES[activeThemeId] || THEMES[DEFAULT_THEME];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      {variant === "compact" ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative flex h-8 items-center gap-1.5 px-2.5 rounded-xl border border-surface-border bg-surface text-clay hover:text-parchment hover:border-mustard/40 transition-colors shadow-sm"
          title={`Active Theme: ${currentTheme.name}`}
          aria-label="Switch Theme"
          aria-expanded={isOpen}
        >
          <Palette className="h-3.5 w-3.5 text-mustard" />
          <span className="hidden sm:inline text-xs font-mono font-medium text-parchment">
            {currentTheme.name}
          </span>
          <div className="flex items-center -space-x-0.5 ml-0.5">
            <span
              className="w-2 h-2 rounded-full border border-surface"
              style={{ backgroundColor: currentTheme.swatches[2] }}
            />
            <span
              className="w-2 h-2 rounded-full border border-surface"
              style={{ backgroundColor: currentTheme.swatches[3] }}
            />
          </div>
          <ChevronDown className="h-3 w-3 text-clay transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-surface-border bg-surface hover:bg-surface-elevated text-xs font-medium text-parchment transition-colors"
          aria-expanded={isOpen}
        >
          <Palette className="h-3.5 w-3.5 text-mustard" />
          <span>{currentTheme.name}</span>
          <ChevronDown className="h-3 w-3 text-clay transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:top-full sm:mt-2 ${
            align === "right" ? "sm:right-0" : "sm:left-0"
          } sm:w-64 max-w-sm mx-auto sm:mx-0 rounded-2xl border border-surface-border bg-surface p-1.5 shadow-2xl z-50 animate-fade-in backdrop-blur-xl`}
          role="menu"
        >
          <div className="px-3 py-2 border-b border-surface-border mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-clay block">
              Workspace Aesthetic
            </span>
          </div>

          <div className="space-y-1">
            {THEME_LIST.map((theme) => {
              const isSelected = theme.id === activeThemeId;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-surface-elevated border border-mustard/40 text-parchment"
                      : "hover:bg-surface-elevated/70 text-clay hover:text-parchment border border-transparent"
                  }`}
                  role="menuitem"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-parchment truncate">
                        {theme.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-mustard/15 text-mustard uppercase font-medium">
                        {theme.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-clay truncate block mt-0.5">
                      {theme.tag}
                    </span>
                  </div>

                  {/* Swatch Dot Row & Checkmark */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center -space-x-1">
                      {theme.swatches.map((color, i) => (
                        <span
                          key={i}
                          className="w-2.5 h-2.5 rounded-full border border-surface shadow-xs"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5 text-mustard" />
                    ) : (
                      <div className="w-3.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
