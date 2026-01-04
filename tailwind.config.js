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
        // Dark gaming theme
        dark: {
          50: '#1e293b',
          100: '#1a2332',
          200: '#151c2a',
          300: '#111827',
          400: '#0f172a',
          500: '#0c1222',
          600: '#080d1a',
          700: '#050912',
          800: '#03050a',
          900: '#010203',
        },
        casino: {
          gold: '#D4AF37',
          'gold-light': '#F4D03F',
          'gold-dark': '#B8860B',
          purple: '#9333ea',
          'purple-dark': '#7e22ce',
          red: '#ef4444',
          'red-dark': '#dc2626',
          green: '#10b981',
          'green-dark': '#059669',
          blue: '#3b82f6',
          'blue-dark': '#2563eb',
        }
      },
      fontFamily: {
        gaming: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-casino': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(147, 51, 234, 0.5), 0 0 10px rgba(147, 51, 234, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(147, 51, 234, 0.8), 0 0 30px rgba(147, 51, 234, 0.5)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        }
      },
      boxShadow: {
        'casino': '0 0 20px rgba(147, 51, 234, 0.5)',
        'gold': '0 0 20px rgba(255, 215, 0, 0.5)',
        'neon': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
      }
    },
  },
  plugins: [],
}
