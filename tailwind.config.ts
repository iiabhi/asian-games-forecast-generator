import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: "#FF9933",
        "india-green": "#138808",
        navy: "#000080",
        gold: "#D4AF37",
        silver: "#C0C0C0",
        bronze: "#CD7F32",
        neutral: "#F3F4F6",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-30px)" } },
        confetti: {
          "0%": { transform: "translate(0,0) rotate(0)", opacity: "1" },
          "100%": { transform: "translate(var(--dx), var(--dy)) rotate(540deg)", opacity: "0" },
        },
      },
      animation: {
        confetti: "confetti 1.1s ease-out forwards",
        "spin-slow": "spin 120s linear infinite",
        float: "float 12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
