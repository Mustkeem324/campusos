/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      spacing: {
        13: '3.25rem',
        18: '4.5rem',
      },
      colors: {
        brand: {
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          900: 'hsl(var(--brand-900))',
        },
        surface: {
          light: 'var(--surface)',
          dark: 'var(--surface)',
          muted: 'var(--surface-muted)',
          cardLight: 'var(--card-bg)',
          cardDark: 'var(--card-bg)',
          DEFAULT: 'var(--surface)',
        },
        app: 'var(--bg-app)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          soft: 'var(--primary-soft)',
        },
        navy: 'var(--navy)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)',
        },
        info: {
          soft: 'var(--info-soft)',
        }
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
