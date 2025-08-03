// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
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
    },
  },
  plugins: [],
}
export default config
