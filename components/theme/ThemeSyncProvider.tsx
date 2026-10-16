"use client";

import * as React from "react";
import { isValidTheme, ThemeId, THEMES } from "@/lib/theme";

export const THEME_BROADCAST_CHANNEL = "hackline_theme_channel";
export const THEME_STORAGE_KEY = "hackline_theme_sync";

export function broadcastThemeChange(themeId: ThemeId) {
  if (typeof window === "undefined") return;

  // 1. Dispatch custom event for current window
  window.dispatchEvent(new CustomEvent("hackline-theme-changed", { detail: themeId }));

  // 2. BroadcastChannel for 0ms cross-tab sync in modern browsers
  try {
    const channel = new BroadcastChannel(THEME_BROADCAST_CHANNEL);
    channel.postMessage({ themeId });
    channel.close();
  } catch {}

  // 3. Storage event fallback for older browser tabs
  try {
    localStorage.setItem(THEME_STORAGE_KEY, `${themeId}:${Date.now()}`);
  } catch {}
}

export function ThemeSyncProvider() {
  React.useEffect(() => {
    const applyTheme = (themeId: ThemeId) => {
      document.documentElement.setAttribute("data-theme", themeId);
      if (THEMES[themeId].category === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      window.dispatchEvent(new CustomEvent("hackline-theme-changed", { detail: themeId }));
    };

    // 1. BroadcastChannel listener for cross-tab updates
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(THEME_BROADCAST_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.themeId && isValidTheme(event.data.themeId)) {
          applyTheme(event.data.themeId);
        }
      };
    } catch {}

    // 2. Storage event listener fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const themeId = e.newValue.split(":")[0];
        if (isValidTheme(themeId)) {
          applyTheme(themeId);
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      channel?.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
