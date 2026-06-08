/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base':      'var(--bg-base)',
        'bg-card':      'var(--bg-card)',
        'bg-elevated':  'var(--bg-elevated)',
        'accent-violet':'var(--accent-violet)',
        'accent-indigo':'var(--accent-indigo)',
        'accent-blue':  'var(--accent-blue)',
        'positive':     'var(--positive)',
        'negative':     'var(--negative)',
        'text-primary': 'var(--text-primary)',
        'text-secondary':'var(--text-secondary)',
      },
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        dm:      ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'violet-glow': '0 8px 32px rgba(124, 92, 252, 0.25)',
        'violet-sm':   '0 4px 16px rgba(124, 92, 252, 0.2)',
      },
      backgroundImage: {
        'header-gradient': 'linear-gradient(135deg, #4c3bc4 0%, #7c5cfc 50%, #a855f7 100%)',
        'btn-gradient':    'linear-gradient(135deg, #7c5cfc 0%, #4f46e5 100%)',
        'icon-violet':     'linear-gradient(135deg, #7c5cfc, #a855f7)',
        'icon-blue':       'linear-gradient(135deg, #3b82f6, #06b6d4)',
        'icon-green':      'linear-gradient(135deg, #22c55e, #16a34a)',
        'icon-red':        'linear-gradient(135deg, #f43f5e, #e11d48)',
        'icon-amber':      'linear-gradient(135deg, #f59e0b, #f97316)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),
  ],
}
