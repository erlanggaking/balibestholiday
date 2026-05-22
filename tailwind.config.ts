import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef7ec',
          100: '#fbe8c5',
          200: '#f7d089',
          300: '#f3b84d',
          400: '#efa324',
          500: '#e0890e',
          600: '#c26a09',
          700: '#9b4d0b',
          800: '#7d3d11',
          900: '#673312',
          950: '#3b1906',
        },
        ocean: {
          50: '#eef9ff',
          100: '#d8f1ff',
          200: '#b9e6ff',
          300: '#88d6ff',
          400: '#4fbcff',
          500: '#279bff',
          600: '#107df5',
          700: '#0966e1',
          800: '#0e54b6',
          900: '#11498f',
          950: '#0e2d57',
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
