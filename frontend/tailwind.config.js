module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        brand: { 500: '#8b5cf6', 600: '#7c3aed' },
      },
    },
  },
  plugins: [],
}
