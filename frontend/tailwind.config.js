/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FFFDF8",
          100: "#F5EDD6",
          200: "#EBD9A8",
        },
        ink: {
          DEFAULT: "#1C1008",
          light: "#3D2B14",
          muted: "#7A6952",
        },
        wood: {
          light: "#A8703F",
          DEFAULT: "#8B5E3C",
          dark: "#6B4419",
          deep: "#4A2D0E",
        },
        amber: {
          book: "#C9853E",
        },
        sage: "#7A8C6A",
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Source Serif 4", "Georgia", "serif"],
        ui: ["Crimson Pro", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
