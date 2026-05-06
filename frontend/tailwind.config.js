/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kpmg: {
          blue: '#00338D',
          lightblue: '#0091DA',
          purple: '#7F3F98',
          gray: '#60656F',
        },
      },
      backgroundOpacity: {
        3: '0.03',
        8: '0.08',
      },
    },
  },
  plugins: [],
}
