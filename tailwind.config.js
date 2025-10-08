/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./**/*.{html,js,ts,tsx,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#D4AF37",       // Scholar Gold
        onBrand: "#0B0F1A",     // Text over gold
        surface: "#0B1220",     // Deep HQ black
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
      },
    },
  },
  safelist: ["bg-brand", "text-onBrand", "bg-surface", "font-display", "dark"],
  plugins: [],
}