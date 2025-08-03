// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b30000',
        'primary-light': '#ff3333',
        secondary: '#d4af37',
        'gold-light': '#fcd34d',
        'bg-dark': '#000',
        'card-bg': '#111',
        'border-dark': '#333',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}