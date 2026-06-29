import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", surface: "var(--surface)", ink: "var(--fg)",
        muted: "var(--fg-muted)", accent: "var(--accent)", "accent-2": "var(--accent-2)",
        money: "var(--money)", "on-accent": "var(--on-accent)", line: "var(--border)",
        ok: "var(--ok)", danger: "var(--danger)"
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      borderRadius: { sm: "var(--radius-sm)", md: "var(--radius-md)", lg: "var(--radius-lg)" },
      boxShadow: { card: "var(--shadow-card)" },
      transitionTimingFunction: { soft: "var(--ease)" }
    }
  },
  plugins: []
};
export default config;
