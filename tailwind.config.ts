import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#FBF4E2',
        surface: '#F6E7C6',
        accent: {
          DEFAULT: '#FE6F20',
          hover:   '#E55F15',
          soft:    '#FFE4D3',
        },
        ink: {
          DEFAULT: '#222222',
          soft:    '#4A4A4A',
          muted:   '#8A8A8A',
        },
        border:  '#E8D9B8',
        success: '#2E8B57',
        warning: '#C77700',
        danger:  '#C0392B',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Batica Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        btn:  '16px',
      },
    },
  },
  plugins: [],
} satisfies Config
