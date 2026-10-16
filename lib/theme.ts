export type ThemeId = "warm-brass" | "sakura-alabaster" | "midnight-sakura" | "glacier-wine";

export const DEFAULT_THEME: ThemeId = "warm-brass";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  category: "dark" | "light";
  tag: string;
  description: string;
  swatches: [string, string, string, string, string]; // [canvas, surface, primary, accent, text]
}

export const THEME_LIST: ThemeConfig[] = [
  {
    id: "warm-brass",
    name: "Warm Brass",
    category: "dark",
    tag: "Signature Dark",
    description: "Deep obsidian backdrop, vintage bauhaus cards, and warm brass gold accents.",
    swatches: ["#14110E", "#1F1B16", "#E5A93C", "#4A82A6", "#FEF3C7"],
  },
  {
    id: "sakura-alabaster",
    name: "Sakura Alabaster",
    category: "light",
    tag: "Cutesy Minimal Light",
    description: "Porcelain milk surface, soft cherry blossom pink, and organic matcha sage accents.",
    swatches: ["#FAF6F4", "#FFFFFF", "#E879A8", "#5E9C87", "#231C20"],
  },
  {
    id: "midnight-sakura",
    name: "Midnight Sakura",
    category: "dark",
    tag: "Cutesy Minimal Dark",
    description: "Midnight velvet plum canvas, glowing neon sakura pink, and frosted mint accents.",
    swatches: ["#141016", "#1E1722", "#F472B6", "#5EEAD4", "#FCE7F3"],
  },
  {
    id: "glacier-wine",
    name: "Glacier Wine",
    category: "dark",
    tag: "Editorial Dark",
    description: "Nordic midnight slate, soothing powder light blue, and vibrant ruby wine accents.",
    swatches: ["#0F131D", "#171D2A", "#93C5FD", "#E11D48", "#F0F9FF"],
  },
];

export const THEMES: Record<ThemeId, ThemeConfig> = THEME_LIST.reduce(
  (acc, theme) => ({ ...acc, [theme.id]: theme }),
  {} as Record<ThemeId, ThemeConfig>
);

export function isValidTheme(val: unknown): val is ThemeId {
  return typeof val === "string" && (
    val === "warm-brass" ||
    val === "sakura-alabaster" ||
    val === "midnight-sakura" ||
    val === "glacier-wine"
  );
}
