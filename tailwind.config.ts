import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", surface: "var(--surface)", "surface-2": "var(--surface-2)",
        ink: "var(--fg)", muted: "var(--fg-muted)",
        accent: "var(--accent)", "accent-2": "var(--accent-2)", "accent-soft": "var(--accent-soft)",
        money: "var(--money)", "on-accent": "var(--on-accent)", line: "var(--border)",
        ok: "var(--ok)", danger: "var(--danger)"
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "system-ui", "sans-serif"],
        display: ["var(--font-roboto)", "system-ui", "sans-serif"]
      },
      borderRadius: { sm: "var(--radius-sm)", md: "var(--radius-md)", lg: "var(--radius-lg)" },
      boxShadow: { card: "var(--shadow-card)", lg: "var(--shadow-lg)" },
      backgroundImage: { hero: "var(--gradient-hero)" },
      letterSpacing: { label: "var(--tracking-label)" },
      transitionTimingFunction: { soft: "var(--ease)" }
    }
  },
  plugins: []
};
export default config;
