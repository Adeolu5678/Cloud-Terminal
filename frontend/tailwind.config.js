/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#020617", // Deep space background
          800: "#0f172a", // Sidebar/panels
          700: "#1e293b", // Borders & active states
          600: "#334155", // Muted text/borders
        },
        primary: {
          500: "#38bdf8", // Neon Cyan
          400: "#7dd3fc",
        },
        accent: {
          500: "#d946ef", // Neon Fuchsia
        },
      },
      fontFamily: {
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 10px rgba(56, 189, 248, 0.5)",
          },
          "50%": {
            opacity: ".5",
            boxShadow: "0 0 20px rgba(56, 189, 248, 0.8)",
          },
        },
      },
    },
  },
  plugins: [],
};
