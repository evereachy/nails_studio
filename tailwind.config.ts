import type { Config } from "tailwindcss";

/**
 * Tailwind НЕ хранит дизайн. Он только читает CSS-переменные из globals.css.
 * Хочешь другой дизайн — меняешь переменные в globals.css, код компонентов не трогаешь.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--c-bg)",
        surface: "var(--c-surface)",
        elevated: "var(--c-elevated)",
        line: "var(--c-line)",
        ink: "var(--c-ink)",
        muted: "var(--c-muted)",
        accent: "var(--c-accent)",
        "accent-ink": "var(--c-accent-ink)",
      },
      borderRadius: {
        card: "var(--r-card)",
        control: "var(--r-control)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        soft: "var(--sh-soft)",
        lift: "var(--sh-lift)",
      },
      fontFamily: {
        display: "var(--f-display)",
        body: "var(--f-body)",
      },
      maxWidth: {
        container: "var(--w-container)",
      },
      transitionTimingFunction: {
        soft: "var(--ease)",
      },
    },
  },
  plugins: [],
};

export default config;
