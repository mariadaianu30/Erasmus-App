/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        pastel: {
          green: {
            light: '#CFE8D9',
            medium: '#A7DCC3',
          },
          blue: {
            light: '#B7D8F5',
            medium: '#A3C8E9',
          },
          beige: {
            light: '#F3E8D8',
            medium: '#E9DCC3',
          },
        },
        elegant: {
          navy: {
            dark: '#0B1D3A',
            medium: '#102949',
          },
          green: {
            dark: '#0F3D3E',
            medium: '#145454',
          },
          brown: {
            light: '#C7B199',
            medium: '#A6937A',
          },
          gray: {
            blue: '#E8EDF2',
            soft: '#F5F7FA',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter-tight)', 'Inter Tight', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
