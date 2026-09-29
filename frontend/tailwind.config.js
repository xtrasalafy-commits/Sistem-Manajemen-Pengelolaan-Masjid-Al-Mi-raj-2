/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Palet warna bertema Islami (hijau zamrud + emas)
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#0B6E4F', // brand utama
          700: '#095C41',
          800: '#074A34',
          900: '#053728',
          950: '#02201a',
        },
        accent: {
          50: '#fdf8ec',
          100: '#faedca',
          200: '#f5d98d',
          300: '#e8c04a',
          400: '#d4a017', // emas
          500: '#b8860b',
          600: '#966c08',
          700: '#74520a',
          800: '#5b410b',
          900: '#4a3509',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        arabic: ['Amiri', 'Scheherazade New', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(16, 185, 129, 0.12), 0 4px 20px -4px rgba(16, 185, 129, 0.08)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
      },
      backgroundImage: {
        'pattern-islamic':
          "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230B6E4F' fill-opacity='0.04'%3E%3Cpath d='M20 0l4 12h12l-9.6 7 3.6 12L20 24l-10 7 3.6-12L4 12h12z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
