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
        // Palette C: Vintage Bauhaus & Warm Brass Design System
        canvas: "#14110e",
        surface: {
          DEFAULT: "#1f1b16",
          elevated: "#28231d",
          sunken: "#100d0a",
          border: "rgba(229, 169, 60, 0.18)",
        },
        brass: {
          DEFAULT: "rgba(229, 169, 60, 0.20)",
          hover: "rgba(229, 169, 60, 0.38)",
          solid: "#d4a042",
        },
        mustard: {
          DEFAULT: "#e5a93c",
          hover: "#d99b2e",
          light: "#f3c768",
          muted: "rgba(229, 169, 60, 0.12)",
        },
        steel: {
          DEFAULT: "#4a82a6",
          hover: "#3d6f8f",
          light: "#7bb4d6",
          muted: "rgba(74, 130, 166, 0.16)",
        },
        parchment: {
          DEFAULT: "#fef3c7",
          muted: "#f5ecd0",
        },
        clay: {
          DEFAULT: "#a89a8c",
          dark: "#6e6256",
          light: "#c5b8ab",
        },
        background: "#14110e",
        foreground: "#fef3c7",
        muted: {
          DEFAULT: "#1f1b16",
          foreground: "#a89a8c",
        },
        card: {
          DEFAULT: "#1f1b16",
          foreground: "#fef3c7",
          border: "rgba(229, 169, 60, 0.18)",
        },
        accent: {
          DEFAULT: "#e5a93c",
          hover: "#d99b2e",
          foreground: "#14110e",
        },
        border: "rgba(229, 169, 60, 0.18)",
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
