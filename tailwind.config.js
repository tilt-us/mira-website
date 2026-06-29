/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      // TODO: replace placeholder values with the final Mira brand palette.
      colors: {
        brand: {
          DEFAULT: '#6d28d9',
          hover: '#5b21b6',
          fg: '#ffffff',
        },
        surface: {
          DEFAULT: '#11111b',
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
