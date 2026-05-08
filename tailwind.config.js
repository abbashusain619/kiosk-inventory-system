/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6faf7',
          100: '#ccf5ef',
          200: '#99ebe0',
          300: '#66e1d0',
          400: '#34d6be',
          500: '#34d6be',
          600: '#2bbaa5',
          700: '#229e8b',
          800: '#198372',
          900: '#106759',
        },
        secondary: {
          500: '#67e933',
        },
        ash: {
          50: '#fdfdfd',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#5a5a5a',
          600: '#3a3a3a',
          700: '#2a2a2a',
          800: '#1a1a1a',
          900: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};