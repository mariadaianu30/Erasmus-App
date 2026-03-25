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
        background: '#FFFFFF',
        foreground: '#0A0A0A',
        accent: {
          DEFAULT: '#0066FF', // Vibrant Blue
          hover: '#0052CC',
          light: '#4A90E2',
        },
        decorative: {
          blue: {
            DEFAULT: '#0066FF',
            dark: '#0047b3',
            light: '#66a3ff',
          }
        },
        elegant: {
          navy: {
            dark: '#0B1D3A',
            medium: '#102949',
          },
          green: { // Keeping strictly for compatibility if needed, but primary is blue
            dark: '#0F3D3E',
            medium: '#145454',
          },
          brown: {
            light: '#C7B199',
            medium: '#A6937A',
          }
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'bus-drive': 'bus-drive 10s cubic-bezier(0.4, 0.0, 0.2, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-12px) rotate(-1.5deg)' },
          '50%': { transform: 'translateY(-8px) rotate(0deg)' },
          '75%': { transform: 'translateY(-15px) rotate(1.5deg)' },
        },
        'bus-drive': {
          '0%': { transform: 'translateX(120vw)', opacity: '1' },
          '15%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { transform: 'translateX(-120vw)', opacity: '0' },
        }
      },
    },
  },
  plugins: [],
}
