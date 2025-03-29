/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-bg': '#121212',
        'game-accent': '#00FFCC',
        'perfect': '#00FF00',
        'good': '#FFFF00',
        'ok': '#FFA500',
        'miss': '#FF0000',
      },
      animation: {
        'pulse-fast': 'pulse 0.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
} 