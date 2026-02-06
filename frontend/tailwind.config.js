/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['DM Mono', 'Menlo', 'monospace'],
        ui: ['Manrope', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        void: '#050505',
        surface: '#0E0E0E',
        elevated: '#171717',
        border: '#252525',
        'border-subtle': '#1A1A1A',
        'text-primary': '#E8DED0',
        'text-secondary': '#7A7268',
        'text-muted': '#4A443C',
        accent: {
          DEFAULT: '#E5A00D',
          bright: '#FFC233',
          deep: '#8B6914',
          glow: 'rgba(229, 160, 13, 0.10)',
        },
        'user-accent': '#4A8F7E',
        danger: '#C44B4B',
      },
      animation: {
        reveal: 'reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'reveal-slow': 'reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'ring-pulse': 'ring-pulse 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'glow-breathe': 'glow-breathe 3s ease-in-out infinite',
        'dot-bounce': 'dot-bounce 1.2s ease-in-out infinite',
        'amber-blink': 'amber-blink 0.7s step-end infinite',
      },
      keyframes: {
        reveal: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'ring-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'glow-breathe': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(229,160,13,0.1), 0 0 60px rgba(229,160,13,0.05)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(229,160,13,0.2), 0 0 80px rgba(229,160,13,0.08)',
          },
        },
        'dot-bounce': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-6px)', opacity: '1' },
        },
        'amber-blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
