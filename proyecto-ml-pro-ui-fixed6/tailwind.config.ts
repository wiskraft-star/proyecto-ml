import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.25)",
      },
      colors: {
        bg: "rgb(var(--bg))",
        panel: "rgb(var(--panel))",
        panel2: "rgb(var(--panel2))",
        border: "rgb(var(--border))",
        text: "rgb(var(--text))",
        muted: "rgb(var(--muted))",
        accent: "rgb(var(--accent))",
        secondary: "rgb(var(--secondary))",
        info: "rgb(var(--info))",
        good: "rgb(var(--good))",
        warn: "rgb(var(--warn))",
        bad: "rgb(var(--bad))",
      },
    },
  },
  plugins: [],
} satisfies Config;
