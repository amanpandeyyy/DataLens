/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#050505',
          surface: '#0B0B0B',
          card: '#111111',
          cardHover: '#161616',
          border: '#242424',
          borderSubtle: '#1C1C1C',
          text: '#FFFFFF',
          textSecondary: '#A1A1AA',
          textMuted: '#71717A',
        },
        brand: {
          blue: '#3B82F6',
          blueHover: '#2563EB',
          blueLight: '#60A5FA',
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': ['0.8125rem', { lineHeight: '1.25rem' }], // 13px
        'sm': ['0.9375rem', { lineHeight: '1.4rem' }],   // 15px
        'base': ['1.0625rem', { lineHeight: '1.6rem' }], // 17px
        'lg': ['1.1875rem', { lineHeight: '1.75rem' }],  // 19px
        'xl': ['1.375rem', { lineHeight: '1.875rem' }],  // 22px
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }], // 26px
        '3xl': ['2rem', { lineHeight: '2.375rem' }],      // 32px
      },
    },
  },
  plugins: [],
}

