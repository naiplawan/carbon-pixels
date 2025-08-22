/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'handwritten': ['var(--font-handwritten)', 'Patrick Hand', 'cursive'],
        'sketch': ['var(--font-sketch)', 'Kalam', 'cursive'],
      },
      colors: {
        'paper': '#faf9f7',
        'ink': '#2d3748',
        'pencil': '#4a5568',
        'green-leaf': '#48bb78',
        'carbon-dark': '#2d3748',
      },
      backgroundImage: {
        'paper-texture': "url('/paper-texture.png')",
      },
      animation: {
        'draw': 'draw 2s ease-in-out',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        draw: {
          '0%': { 'stroke-dasharray': '0 100' },
          '100%': { 'stroke-dasharray': '100 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}