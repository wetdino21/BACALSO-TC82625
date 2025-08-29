import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0077B6',
        'brand-secondary': '#00B4D8',
        'brand-accent': '#90E0EF',
        'brand-light': '#CAF0F8',
        'brand-dark': '#03045E',
      },
    },
  },
  plugins: [
    typography,
    forms,
  ],
};
export default config;