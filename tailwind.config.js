/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan all Angular templates and component sources for utility classes.
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      // ---------------------------------------------------------------------
      // Central design tokens (single source of truth for the whole site).
      // TODO: finalise these values together with the official Mira style guide
      // and the game-client background art. Tune them here once — every page
      // and component picks them up automatically.
      // ---------------------------------------------------------------------
      colors: {
        brand: {
          DEFAULT: '#6d28d9', // primary accent (buttons, links)
          hover: '#5b21b6', // primary hover/active
          fg: '#ffffff', // text/icon colour on top of the brand colour
        },
        surface: {
          DEFAULT: '#11111b', // panels / modals over the background image
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
