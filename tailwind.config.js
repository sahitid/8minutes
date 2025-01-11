module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        radley: ['Radley', 'serif'],
    },
    animation: {
      'bounce-slow': 'bounce 2.5s infinite', 
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
  },
}


