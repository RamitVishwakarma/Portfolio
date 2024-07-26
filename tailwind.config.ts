import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      red: "#ff8885",
      orange: "#ffc67e",
      yellow: "#fafe8e",
      green: "#a8fe96",
      "light-blue": "#77effd",
      blue: "#7caafd",
      purple: "#9e8bfd",
      pink: "#ff9dfb",
      white: "#FFFFFF",
      black: "#000000",
      //  ? Testimonial colors
      "ceris-red-800": "#a70d3b",
      "ceris-red-700": "#ca0c47",
      "ceris-red-600": "#e91f64",
      "ceris-red-500": "#f83c86",
      "ceris-red-300": "#ffa2cb",
      "ceris-red-100": "#fee5f0",
      "ceris-red-50": "#fef1f7",
      De: {
        York: {
          800: "#205b33",
          700: "#23723c",
          600: "#299048",
          500: "#38af5c",
          300: "#94e1ab",
          100: "#e0f8e6",
          50: "#f2fbf4",
        },
      },
      Melanzane: {
        800: "#961e6c",
        700: "#b62084",
        600: "#d230a1",
        500: "#e450be",
        300: "#f5ace6",
        100: "#fbe8f8",
        50: "#fcf3fa",
      },
    },
    extend: {
      animation: {
        shine: "shine 1s",
      },
      keyframes: {
        shine: {
          "100%": { left: "125%" },
        },
      },
      fontFamily: {
        Anton: ["Anton SC", "sans-serif"],
        ProductSans: ["ProductSans", "sans"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
