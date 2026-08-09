/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F1A",
        panel: "#141A2A",
        panel2: "#1B2236",
        border: "#232B40",
        accent: "#F2B705",
        "accent-dark": "#C99400",
        accent2: "#22C55E",
        gold: "#FFD23F",
        danger: "#EF4444",
        muted: "#8993A8",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Thai", "sans-serif"],
      },
    },
  },
  plugins: [],
};
