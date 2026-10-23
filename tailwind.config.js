/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EEF2F7",
        ink: "#14213D",
        muted: "#5B6B85",
        line: "#CBD5E3",
        safe: "#1B998B",
        warn: "#E09F00",
        danger: "#D7263D",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
