module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        sketch: ['Caveat', 'cursive'],
      },
      colors: {
        paper: '#f9f6f0',
        ink: '#1c1917',
        butter: '#e8d56b',
        blush: '#f0d9d4',
        sage: '#d9e4d4',
        peach: '#f5e6c8',
      },
      animation: {
        'bounce-slow': 'bounce 2.5s infinite',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
