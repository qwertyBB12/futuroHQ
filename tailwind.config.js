module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx}",
    "./schemaTypes/**/*.{ts,js}",
    "./*.{ts,js,tsx}"
  ],
  safelist: [
    "bg-surface",
    "font-display",
    "font-bold",
    "text-white",
    "dark",
    "bg-[#121212]",   // Founder's Black fallback
    "bg-[#0B1220]",   // Deeper black if used
    "uppercase",
    "tracking-wide",
    "text-3xl",
    "text-4xl"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
      },
      colors: {
        surface: 'var(--founders-black)', // maps to #121212
        brand: 'var(--hoya-blue)',
        onBrand: '#ffffff'
      }
    }
  },
  plugins: []
}