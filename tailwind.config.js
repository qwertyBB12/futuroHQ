/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{ts,tsx}",
    "./schemaTypes/**/*.{ts,js}",
    "./sanity.config.ts"
  ],
  safelist: [
    "bg-surface",
    "bg-brand",
    "font-display",
    "font-bold",
    "text-white",
    "uppercase",
    "tracking-wide",
    "text-3xl",
    "text-4xl",
    "bg-[#1B2A41]",
    "bg-[#121212]",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Oswald', 'sans-serif']
      },
      colors: {
        surface: 'var(--component-bg)',
        brand: 'var(--main-navigation-color)',
        onBrand: 'var(--main-navigation-color--inverted)',
        foundersBlack: '#121212',
        hoyasMidnight: '#1B2A41',
        archivalSlate: '#8A8D91',
        scholarGold: '#D4AF37',
        sandstone: '#F2E5D5',
        garnet: '#8C1E4A',
      }
    }
  },
  plugins: [],
}