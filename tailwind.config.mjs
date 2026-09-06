/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        satoshi: ["Satoshi", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      colors: {
        brand: {
          lavenderGrey: "#8895B3",
          softPeriwinkle: "#8E94F2",
          darksoftPeriwinkle: "#595c96",
          wisteriaBlue: "#9FA0FF",
          mauve: "#BBADFF",
          darkmauve: "#846df7",
          cream: "#FAF9F7",
          nearBlack: "#1A1A1A",
          warmGray: "#6B6B6B",
          lightGray: "#E8E8E8",
          deepPurple: "#403165",
          peach: "#f8efe9",
          amethyst: "#7c5cbf",
          popupBg: "#EDEDED",
        },
        primary: {
          DEFAULT: "#8E94F2",
          hover: "#7B82EE",
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#8E94F2",
          600: "#7B82EE",
          700: "#676EDB",
        },
        dark: {
          DEFAULT: "#111928",
          2: "#1F2A37",
          3: "#374151",
          4: "#4B5563",
          5: "#6B7280",
          6: "#9CA3AF",
          7: "#D1D5DB",
          8: "#E5E7EB",
        },
        "gray-dark": "#121214",
        border: "rgba(226, 232, 240, 0.8)",
      },
    },
  },
  plugins: [],
};

export default config;
