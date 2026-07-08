/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      // Palette matched to the Mira client UI: dark blue-black slate + gold accent.
      colors: {
        // Primary action = the client's gold accent (dark text on gold).
        brand: {
          DEFAULT: 'var(--app-brand, #f2c45b)',
          hover: 'var(--app-brand-hover, #f4cf78)',
          fg: 'var(--app-brand-fg, #101216)',
        },
        accent: {
          DEFAULT: 'var(--app-accent, #f2c45b)',
          hover: 'var(--app-accent-hover, #f4cf78)',
        },
        surface: {
          DEFAULT: '#101216',
          raised: '#20242c',
          'raised-hover': '#29303a',
          border: 'rgba(255, 255, 255, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
