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
      "google-red": "#DB4437",
      "google-green": "#0F9D58",
      "google-blue": "#4285F4",
      "google-yellow": "#F4B400",
    },
    extend: {
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
