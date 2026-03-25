/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'cnc-dark': '#1a1a2e',
        'cnc-blue': '#16213e',
        'cnc-accent': '#0f3460',
        'cnc-highlight': '#e94560',
        'cnc-success': '#10b981',
        'cnc-warning': '#f59e0b',
        'cnc-error': '#ef4444',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
