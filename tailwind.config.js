const { link } = require('fs')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#cd4546',     // Lava Red
        interective: '#ac4c39', // Lava Red
        secondary: '#0F172A',   // Deep Navy
        accent: '#FFD700',      // Bright Yellow
        info: '#FFD700',        // Using same as accent for highlight
        graylight: '#0C121A',
        main: 'var(--text-main)',
        secondaryText: 'var(--text-secondary)', // renamed to avoid collision
        active: 'var(--bg-active)',
        yes: '#3fb68b',         // You can keep or adjust these based on use
        no: '#ff5353'
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['[data-theme=light]'],
          primary: '#FF5631',
          secondary: '#0F172A',
          accent: '#FFD700',
          'base-100': '#FFFFFF',
        },
      },
      {
        dark: {
          ...require('daisyui/src/theming/themes')['[data-theme=dark]'],
          primary: '#FF5631',
          secondary: '#FFD700',
          accent: '#FF5631',
          'base-100': '#0A0A0A',
          'base-200': '#1A1A1A',
        },
      },
    ],
  },
};
