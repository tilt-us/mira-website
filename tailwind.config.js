/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      // Palette derived from the Lira client wallpaper (violet magic + gold gears).
      colors: {
        brand: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed',
          fg: '#ffffff',
        },
        accent: {
          DEFAULT: '#e0b341',
          hover: '#c99a2e',
        },
        surface: {
          DEFAULT: '#0e0a1a',
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
