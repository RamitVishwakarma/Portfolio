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
      grey: {
        900: "#3d3d3d",
        300: "#b0b0b0",
        200: "#d1d1d1",
      },
      //  ? Testimonial colors
      ceris: {
        red: {
          800: "#a70d3b",
          700: "#ca0c47",
          600: "#e91f64",
          500: "#f83c86",
          300: "#ffa2cb",
          100: "#fee5f0",
          50: "#fef1f7",
        },
      },
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
      Saffron: {
        Mango: {
          800: "#942f0c",
          700: "#b73e06",
          600: "#dd5d02",
          500: "#f98207",
          300: "#ffbc42",
          100: "#ffedc6",
          50: "#fff9eb",
        },
      },
      Portage: {
        800: "#2c3aa1",
        700: "#3045c5",
        600: "#3957d7",
        500: "#4e74e3",
        300: "#9ebcf2",
        100: "#dee7fb",
        50: "#f1f5fd",
      },
      Scarlet: {
        800: "#6f17b2",
        700: "#8315db",
        600: "#9825f8",
        500: "#ab49ff",
        300: "#d9aeff",
        100: "#f3e6ff",
        50: "#faf4ff",
      },
      Slate: {
        Gray: {
          800: "#5d6976",
          700: "#708090",
          600: "#8496a7",
          500: "#9bacb9",
          300: "#c7d5da",
          100: "#ecf2f3",
          50: "#f5f8f8",
        },
      },
      Tomato: {
        800: "#a5260f",
        700: "#c8290d",
        600: "#ed3615",
        500: "#ff6347",
        300: "#ffac9d",
        100: "#ffe4df",
        50: "#fff3f1",
      },
    },
    screens: {
      lg: "1200px",
      md: "800px",
      five: "580px",
      sm: "400px",
    },
    extend: {
      animation: {
        shine: "shine 1s",
        "infinite-scroll": "infinite-scroll 10s linear infinite",
      },
      keyframes: {
        shine: {
          "100%": { left: "125%" },
        },
        "infinite-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
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
