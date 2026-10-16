import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Toaster } from "sonner";
import { DEFAULT_THEME, isValidTheme, THEMES } from "@/lib/theme";
import { ThemeSyncProvider } from "@/components/theme/ThemeSyncProvider";

export const metadata: Metadata = {
  title: "Hackline — Next-Gen Hackathon Management Platform",
  description: "Organize, track, and dominate hackathons with elite team workspaces and smart integrations.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawTheme = cookieStore.get("hackline_theme")?.value;
  const activeTheme = isValidTheme(rawTheme) ? rawTheme : DEFAULT_THEME;
  const isDark = THEMES[activeTheme]?.category === "dark";

  return (
    <html lang="en" data-theme={activeTheme} className={isDark ? "dark" : ""}>
      <body className="min-h-screen bg-canvas text-parchment antialiased selection:bg-mustard/30 selection:text-parchment">
        <ThemeSyncProvider />
        {children}
        <Toaster
          position="top-right"
          theme={isDark ? "dark" : "light"}
          toastOptions={{
            style: {
              background: "var(--bg-surface, #1f1b16)",
              border: "1px solid var(--border-primary, rgba(229, 169, 60, 0.25))",
              color: "var(--text-parchment, #fef3c7)",
            },
          }}
        />
      </body>
    </html>
  );
}
