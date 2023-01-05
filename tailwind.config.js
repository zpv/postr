/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");
module.exports = {
  content: ["./src/**/*.{html,js,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Futura", ...defaultTheme.fontFamily.sans],
      },
      screens: {
        xs: "650px",
        sm: "900px",
      },
    },
    ripple: (theme) => ({
      colors: theme("colors"),
    }),
  },
  plugins: [
    require("tailwindcss-ripple")(),
    require("prettier-plugin-tailwindcss"),
  ],
};
