/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'linkz-green': '#589c7f',
        'linkz-green-hover': '#4a856c',
        surface: '#111111',
        'surface-elevated': '#1a1a1a',
        'surface-card': '#141414',
        border: '#2a2a2a',
        muted: '#888888',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
