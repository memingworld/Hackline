import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Multi-Theme Dynamic Token System (Warm Brass, Sakura Alabaster, Midnight Sakura, Glacier Wine)
        canvas: "var(--bg-canvas, #14110e)",
        surface: {
          DEFAULT: "var(--bg-surface, #1f1b16)",
          elevated: "var(--bg-surface-elevated, #28231d)",
          sunken: "var(--bg-surface-sunken, #100d0a)",
          border: "var(--border-primary, rgba(229, 169, 60, 0.18))",
        },
        brass: {
          DEFAULT: "var(--accent-brass-subtle, rgba(229, 169, 60, 0.20))",
          hover: "var(--accent-brass-hover, rgba(229, 169, 60, 0.38))",
          solid: "var(--accent-brass-solid, #d4a042)",
        },
        mustard: {
          DEFAULT: "var(--accent-mustard, #e5a93c)",
          hover: "var(--accent-mustard-hover, #d99b2e)",
          light: "var(--accent-mustard-light, #f3c768)",
          muted: "var(--accent-mustard-muted, rgba(229, 169, 60, 0.12))",
        },
        steel: {
          DEFAULT: "var(--accent-steel, #4a82a6)",
          hover: "var(--accent-steel-hover, #3d6f8f)",
          light: "var(--accent-steel-light, #7bb4d6)",
          muted: "var(--accent-steel-muted, rgba(74, 130, 166, 0.16))",
        },
        parchment: {
          DEFAULT: "var(--text-parchment, #fef3c7)",
          muted: "var(--text-parchment-muted, #f5ecd0)",
        },
        clay: {
          DEFAULT: "var(--text-clay, #a89a8c)",
          dark: "var(--text-clay-dark, #6e6256)",
          light: "var(--text-clay-light, #c5b8ab)",
        },
        background: "var(--bg-canvas, #14110e)",
        foreground: "var(--text-parchment, #fef3c7)",
        muted: {
          DEFAULT: "var(--bg-surface, #1f1b16)",
          foreground: "var(--text-clay, #a89a8c)",
        },
        card: {
          DEFAULT: "var(--bg-surface, #1f1b16)",
          foreground: "var(--text-parchment, #fef3c7)",
          border: "var(--border-primary, rgba(229, 169, 60, 0.18))",
        },
        accent: {
          DEFAULT: "var(--accent-mustard, #e5a93c)",
          hover: "var(--accent-mustard-hover, #d99b2e)",
          foreground: "var(--bg-canvas, #14110e)",
        },
        border: "var(--border-primary, rgba(229, 169, 60, 0.18))",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "shimmer": "shimmer 2s linear infinite",
        "fade-in": "fadeIn 0.3s ease-out forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
