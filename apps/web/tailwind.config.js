/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{svelte,js,ts}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#f4f7fb",
          1: "#fbfdff",
          2: "#f1f5f9",
          3: "#e7eef6",
          4: "#d7e2ee",
        },
        border: {
          DEFAULT: "#d5dde7",
          strong: "#b6c4d2",
          hover: "#96a8ba",
        },
        ink: {
          DEFAULT: "#102031",
          muted: "#41586a",
          faint: "#708599",
        },
        accent: {
          DEFAULT: "#0b8db8",
          strong: "#086d8f",
          dim: "#d6edf6",
          glow: "rgba(11, 141, 184, 0.12)",
        },
        good: {
          DEFAULT: "#0a7b62",
          dim: "#dff4ee",
          glow: "rgba(10, 123, 98, 0.12)",
        },
        bad: {
          DEFAULT: "#b33a4a",
          dim: "#fdecef",
          glow: "rgba(179, 58, 74, 0.1)",
        },
        warn: {
          DEFAULT: "#b45309",
          dim: "#fff3e5",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', '"Segoe UI"', "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
        display: ['"Space Grotesk"', '"DM Sans"', "sans-serif"],
      },
      boxShadow: {
        glow: "0 12px 28px rgba(11, 141, 184, 0.08)",
        "glow-strong": "0 18px 40px rgba(11, 141, 184, 0.14)",
        panel: "0 18px 48px rgba(15, 23, 42, 0.08)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.7)",
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
