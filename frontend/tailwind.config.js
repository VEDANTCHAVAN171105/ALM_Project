/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#070B14",
        surface: "#0D1120",
        elevated: "#141B2E",
        cyan: "#00D4FF",
        purple: "#7C3AED",
        glow: "rgba(0, 212, 255, 0.15)",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        primary: "#E2E8F0",
        secondary: "#64748B",
        border: "rgba(255, 255, 255, 0.06)"
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
        mono: ["Space Mono", "monospace"]
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(0, 212, 255, 0.15)" },
          "50%": { boxShadow: "0 0 28px rgba(0, 212, 255, 0.28)" }
        },
        "scan-line": {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "pulse-record": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.35)" },
          "70%": { boxShadow: "0 0 0 22px rgba(239, 68, 68, 0)" }
        }
      },
      animation: {
        "pulse-glow": "pulse-glow 2.6s ease-in-out infinite",
        "scan-line": "scan-line 1.8s linear infinite",
        "fade-up": "fade-up 0.45s ease forwards",
        "pulse-record": "pulse-record 1.5s infinite"
      }
    }
  },
  plugins: []
};
