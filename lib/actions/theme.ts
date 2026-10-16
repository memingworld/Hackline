"use server";

import { cookies } from "next/headers";
import { ThemeId, DEFAULT_THEME, isValidTheme } from "@/lib/theme";
import { createClient } from "@/utils/supabase/server";

const THEME_COOKIE_NAME = "hackline_theme";

/**
 * Persists the user's selected theme in a 1-year client cookie.
 * If authenticated, silently syncs to profiles.theme in Supabase for cross-device permanence.
 */
export async function setThemeAction(theme: string): Promise<{ success: boolean; theme: ThemeId }> {
  const targetTheme: ThemeId = isValidTheme(theme) ? theme : DEFAULT_THEME;
  const cookieStore = await cookies();

  // 1. Save 1-year persistent cookie (accessible across entire site, 0ms SSR read)
  cookieStore.set(THEME_COOKIE_NAME, targetTheme, {
    path: "/",
    maxAge: 31536000, // 365 days
    sameSite: "lax",
    httpOnly: false, // Accessible client-side if needed for instant bootstrap
  });

  // 2. Silently sync to Supabase profile for cross-device sync if logged in
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ theme: targetTheme })
        .eq("id", user.id);
    }
  } catch {
    // Non-blocking: cookie ensures device permanence even if database column is pending migration
  }

  return { success: true, theme: targetTheme };
}

/**
 * Reads the active theme from the request cookies.
 */
export async function getThemeAction(): Promise<ThemeId> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(THEME_COOKIE_NAME)?.value;
    return isValidTheme(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
