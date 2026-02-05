/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        green: {
          DEFAULT: '#27ae60',
          dark: '#1e8449',
          light: '#2ecc71',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite',
        'highlight': 'highlight 2s ease-in-out',
      },
      keyframes: {
        highlight: {
          '0%': { backgroundColor: '#d4edda' },
          '100%': { backgroundColor: 'white' },
        }
      }
    },
  },
  plugins: [],
}
