import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand color: VIBRANT BLUE (Bali sky / ocean)
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdaff',
          300: '#8ec1ff',
          400: '#599eff',
          500: '#3279ff',
          600: '#1d59f5',
          700: '#1746e0',
          800: '#193bb6',
          900: '#1a3890',
          950: '#142357',
        },
        // Secondary accent: WARM ORANGE (Bali sunset / energy)
        ocean: {
          // Kept name for backward compat — actually now ORANGE
          50: '#fff7ed',
          100: '#ffedd4',
          200: '#ffd7a8',
          300: '#ffba70',
          400: '#ff9637',
          500: '#ff7a10',
          600: '#f15e06',
          700: '#c84508',
          800: '#9f370e',
          900: '#80300f',
          950: '#451606',
        },
        // Direct alias for new code
        sunset: {
          50: '#fff7ed',
          100: '#ffedd4',
          200: '#ffd7a8',
          300: '#ffba70',
          400: '#ff9637',
          500: '#ff7a10',
          600: '#f15e06',
          700: '#c84508',
          800: '#9f370e',
          900: '#80300f',
          950: '#451606',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
