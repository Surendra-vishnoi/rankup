/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        /* ── Base dark palette ── */
        bg: {
          deep:    '#080b12',   // Slightly richer true-dark base
          surface: '#0d1120',
          card:    '#111827',   // Deep navy-grey
          card2:   '#182035',
          hover:   '#1e2740',
        },

        /* ── Primary accent (indigo/violet) ── */
        accent: {
          DEFAULT: '#6366f1',   // Indigo-500
          light:   '#818cf8',   // Indigo-400
          violet:  '#a78bfa',   // Violet-400
          cf:      '#f97316',   // Codeforces orange
        },

        /* ── Codeforces rank colours (official palette) ── */
        cf: {
          newbie:    '#808080',
          pupil:     '#008000',
          specialist:'#03a89e',
          expert:    '#0000ff',
          cm:        '#aa00aa', // Candidate Master — purple
          master:    '#ffa500',
          im:        '#ff8c00', // International Master
          gm:        '#ff0000', // Grandmaster
          igm:       '#ff3700', // International Grandmaster
          lgm:       '#ff0000', // Legendary Grandmaster (red + special crown)
        },

        /* ── Semantic surface colors ── */
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          subtle:  'rgba(255,255,255,0.04)',
          accent:  'rgba(99,102,241,0.3)',
          gold:    'rgba(234,179,8,0.3)',
        },
      },

      boxShadow: {
        glow:          '0 0 40px rgba(99,102,241,0.18)',
        'glow-sm':     '0 0 20px rgba(99,102,241,0.14)',
        card:          '0 4px 40px rgba(0,0,0,0.55)',
        'card-hover':  '0 8px 48px rgba(0,0,0,0.6)',
        btn:           '0 4px 20px rgba(99,102,241,0.4)',
        'btn-hover':   '0 8px 30px rgba(99,102,241,0.55)',
        'gold':        '0 0 16px rgba(234,179,8,0.15)',
        'gold-hover':  '0 0 24px rgba(234,179,8,0.25)',
        'inner-dark':  'inset 0 1px 0 rgba(255,255,255,0.05)',
      },

      keyframes: {
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        popIn: {
          '0%':   { opacity: '0', transform: 'scale(0.85)' },
          '80%':  { transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up':  'fadeSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in':  'fadeIn 0.25s ease both',
        'shimmer':  'shimmer 2s linear infinite',
        'pop-in':   'popIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
