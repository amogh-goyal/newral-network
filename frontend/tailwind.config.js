/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backdropFilter: {
        'none': 'none',
        'sm': 'blur(4px)',
        'md': 'blur(12px)',
        'lg': 'blur(24px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function({ addUtilities, theme }) {
      const backdropFilters = theme('backdropFilter');
      const utilities = {};
      for (const [key, value] of Object.entries(backdropFilters)) {
        utilities[`.backdrop-blur-${key}`] = { 'backdrop-filter': value };
      }
      addUtilities(utilities, ['responsive', 'hover']);
    },
  ],
}

