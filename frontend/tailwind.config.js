/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        neon: '#F97316',
        'neon-dim': '#EA6C0A',
        'neon-glow': 'rgba(249,115,22,0.15)',
        void: '#06060F',
        surface: '#0D0D1F',
        panel: '#11112A',
        border: '#1E1E42',
      },
      boxShadow: {
        neon: '0 0 20px rgba(249,115,22,0.3), 0 0 60px rgba(249,115,22,0.1)',
        'neon-sm': '0 0 10px rgba(249,115,22,0.2)',
        card: '0 4px 24px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bar-fill': 'barFill 1s ease-out forwards',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        barFill: {
          from: { width: '0%' },
          to: { width: 'var(--target-width)' },
        },
      },
    },
  },
  plugins: [],
}