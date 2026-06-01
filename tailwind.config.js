/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFAF6',
          100: '#FFF5F0',
          200: '#FFE8DC',
          300: '#FFD5C2',
        },
        rose: {
          bakery: '#C0576A',
          dark: '#8B2252',
          light: '#E8899A',
          pale: '#F5D5DC',
        },
        chocolate: {
          DEFAULT: '#2D1B0E',
          light: '#5C3D2E',
          medium: '#8B5E3C',
        },
        gold: {
          DEFAULT: '#D4A853',
          light: '#F0CC87',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card': '0 4px 20px rgba(45, 27, 14, 0.08)',
        'card-hover': '0 8px 40px rgba(45, 27, 14, 0.15)',
        'rose': '0 4px 20px rgba(192, 87, 106, 0.25)',
      },
    },
  },
  plugins: [],
}
