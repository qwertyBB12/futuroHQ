/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './pages/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx}',
    './sanity.cli.{js,ts}',
    './schemaTypes/**/*.{ts,js}',
    './styles.css',
    './sanity.config.{js,ts}',
    './theme.{js,ts}',
  ],
  safelist: [
    'bg-surface',
    'bg-brand',
    'font-display',
    'font-body',
    'font-mono',
    'font-bold',
    'text-white',
    'text-copper',
    'text-vermillion',
    'uppercase',
    'tracking-wide',
    'text-3xl',
    'text-4xl',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Mulish', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: 'var(--component-bg)',
        brand: 'var(--founders-black)',
        onBrand: 'var(--sandstone)',
        foundersBlack: '#0E0E0E',
        midnight: '#162931',
        copper: {
          light: '#C4A497',
          DEFAULT: '#B17E68',
          dark: '#97644E',
          deep: '#83533F',
        },
        vermillion: {
          light: '#CA7772',
          DEFAULT: '#C84841',
          dark: '#A13B36',
          deep: '#813531',
        },
        sandstone: {
          light: '#FAF6F0',
          DEFAULT: '#F2E5D5',
          dark: '#E8D5C0',
        },
        archivalSlate: {
          light: '#B8B5B1',
          DEFAULT: '#8B8985',
          dark: '#5C5A57',
        },
      },
    },
  },
  plugins: [],
}
