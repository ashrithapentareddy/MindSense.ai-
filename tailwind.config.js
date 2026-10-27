/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Midnight / near-black backgrounds
        ink: {
          950: '#070710',
          900: '#0b0b16',
          850: '#0f0f1d',
          800: '#141425',
          750: '#1a1a2e',
          700: '#20203a',
        },
        // Electric violet accents
        violet: {
          50: '#f4f1ff',
          100: '#ebe5ff',
          200: '#d9ceff',
          300: '#bda8ff',
          400: '#9b78ff',
          500: '#7c4dff',
          600: '#6a35f0',
          700: '#5a27d4',
          800: '#4a20ad',
          900: '#3d1c8c',
        },
        // Lavender (softer accent)
        lavender: {
          300: '#c8b8ff',
          400: '#b3a0ff',
          500: '#9d88f5',
        },
        // Restrained cyan highlight
        cyan: {
          300: '#7ee8e8',
          400: '#5fd4d4',
          500: '#3fbfbf',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        navy: {
          800: '#1e3a5f',
          900: '#172a4a',
        },
        'off-white': '#f8fafc',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(124,77,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(124,77,255,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      boxShadow: {
        glow: '0 0 24px -2px rgba(124,77,255,0.45)',
        'glow-sm': '0 0 12px -2px rgba(124,77,255,0.35)',
        'glow-cyan': '0 0 20px -4px rgba(63,191,191,0.4)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.25)', opacity: '0' },
          '100%': { transform: 'scale(1.25)', opacity: '0' },
        },
        'wave-up': {
          '0%,100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
